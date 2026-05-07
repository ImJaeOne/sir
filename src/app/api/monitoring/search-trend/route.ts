import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DATALAB_URL = 'https://openapi.naver.com/v1/datalab/search';

interface Body {
  workspace_id: string;
}

interface DatalabPoint {
  period: string;
  ratio: number;
}

interface DatalabResponse {
  results?: { data?: DatalabPoint[] }[];
}

interface SearchPoint {
  date: string;
  ratio: number;
}

/** YYYY-MM-DD (KST). */
function kstTodayStr(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 모니터링 검색 트렌드 — 네이버 데이터랩 일배치 캐시 + route handler.
 *
 * 1) Supabase RLS 로 워크스페이스 접근 권한 확인 + company_name 조회
 * 2) `monitoring_search_trends_cache` 에 today_kst row 있으면 cache hit → 반환
 * 3) miss 면 네이버 데이터랩 365일치 호출 → UPSERT → 반환
 *
 * 단일 ws 안에서 사용자 N명이 같은 날 호출해도 네이버 API 는 1회만 발생.
 * 동시 호출 race 시 두 번 호출될 수 있으나 UPSERT 가 last-write-wins 로 안정 (응답 동일).
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정' },
      { status: 500 },
    );
  }

  const { workspace_id } = (await req.json()) as Body;
  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id 누락' }, { status: 400 });
  }

  // RLS 로 멤버십 검증 + company_name 조회 (멤버 아니면 0건).
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('company_name')
    .eq('id', workspace_id)
    .maybeSingle();
  if (wsErr) {
    return NextResponse.json({ error: wsErr.message }, { status: 500 });
  }
  if (!ws) {
    return NextResponse.json({ error: '워크스페이스 접근 권한 없음' }, { status: 404 });
  }
  const keyword = ws.company_name;
  if (!keyword) {
    return NextResponse.json({ error: 'company_name 미설정' }, { status: 400 });
  }

  const today = kstTodayStr();

  // service_role 클라이언트 — 캐시 SELECT/UPSERT 용 (RLS 우회 + 타입 미생성 테이블 접근)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1) cache hit 확인
  const { data: cached } = await admin
    .from('monitoring_search_trends_cache')
    .select('generated_kst_date, start_date, end_date, keyword, points')
    .eq('workspace_id', workspace_id)
    .maybeSingle();

  if (cached && cached.generated_kst_date === today && cached.keyword === keyword) {
    return NextResponse.json({
      keyword: cached.keyword,
      start: cached.start_date,
      end: cached.end_date,
      points: cached.points as SearchPoint[],
      cached: true,
    });
  }

  // 2) 캐시 miss → 네이버 데이터랩 365일 호출
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const endDate = kstNow.toISOString().slice(0, 10);
  const startMs = kstNow.getTime() - 364 * 24 * 60 * 60 * 1000;
  const startDate = new Date(startMs).toISOString().slice(0, 10);

  let datalab: DatalabResponse;
  try {
    const res = await fetch(DATALAB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: 'date',
        keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[search-trend] datalab', res.status, text.slice(0, 300));
      // 네이버 실패 시 stale 캐시라도 있으면 반환 (degraded mode)
      if (cached) {
        return NextResponse.json({
          keyword: cached.keyword,
          start: cached.start_date,
          end: cached.end_date,
          points: cached.points as SearchPoint[],
          cached: true,
          stale: true,
        });
      }
      return NextResponse.json(
        { error: `네이버 데이터랩 응답 ${res.status}` },
        { status: 502 },
      );
    }
    datalab = (await res.json()) as DatalabResponse;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[search-trend] fetch 실패:', message);
    if (cached) {
      return NextResponse.json({
        keyword: cached.keyword,
        start: cached.start_date,
        end: cached.end_date,
        points: cached.points as SearchPoint[],
        cached: true,
        stale: true,
      });
    }
    return NextResponse.json(
      { error: `네이버 데이터랩 호출 실패: ${message}` },
      { status: 502 },
    );
  }

  const raw = datalab.results?.[0]?.data ?? [];
  const points: SearchPoint[] = raw.map((p) => ({ date: p.period, ratio: p.ratio }));

  // 3) UPSERT — race 시 last-write-wins (같은 ws 면 응답 동일하므로 안전)
  const { error: upsertErr } = await admin
    .from('monitoring_search_trends_cache')
    .upsert(
      {
        workspace_id,
        generated_kst_date: today,
        start_date: startDate,
        end_date: endDate,
        keyword,
        points,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id' },
    );
  if (upsertErr) {
    console.error('[search-trend] cache UPSERT 실패:', upsertErr.message);
    // UPSERT 실패해도 호출자에게는 정상 데이터 반환 (다음 호출 때 다시 시도)
  }

  return NextResponse.json({
    keyword,
    start: startDate,
    end: endDate,
    points,
    cached: false,
  });
}

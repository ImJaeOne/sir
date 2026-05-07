import { NextRequest, NextResponse } from 'next/server';

/** 모니터링 AI 분석 — 백엔드(`/api/monitoring/ai-analysis`) proxy.
 *
 * 클라이언트 → Next.js (same-origin) → sir-backend.
 * Authorization 헤더는 그대로 forward. 응답은 markdown content + usage 메타.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL 미설정' }, { status: 500 });
  }

  const body = await req.text();

  try {
    const res = await fetch(`${backendUrl}/api/monitoring/ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`[ai-analysis route] backend ${res.status}:`, text.slice(0, 500));
    }
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[ai-analysis route] fetch 실패:', message);
    return NextResponse.json(
      { error: `백엔드 호출 실패: ${message}` },
      { status: 502 },
    );
  }
}

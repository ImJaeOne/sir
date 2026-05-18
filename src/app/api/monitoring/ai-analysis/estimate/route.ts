import { NextRequest, NextResponse } from 'next/server';

/** 모니터링 AI 분석 예상 토큰 — 백엔드(`/api/monitoring/ai-analysis/estimate`) proxy.
 *  모달에서 기간 선택 즉시 호출 → input 실측 + output 추정 + 잔여량 반환.
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
    const res = await fetch(`${backendUrl}/api/monitoring/ai-analysis/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `백엔드 호출 실패: ${message}` }, { status: 502 });
  }
}

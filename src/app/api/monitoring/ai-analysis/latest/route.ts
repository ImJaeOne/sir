import { NextRequest, NextResponse } from 'next/server';

/** 가장 최근 분석 결과 1건 — 백엔드(`/api/monitoring/ai-analysis/latest`) proxy.
 *  AiAnalysisCard mount 시 default 표시용. 없으면 backend 가 null 반환.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const workspaceId = new URL(req.url).searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id 필요' }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL 미설정' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${backendUrl}/api/monitoring/ai-analysis/latest?workspace_id=${encodeURIComponent(workspaceId)}`,
      { headers: { Authorization: auth }, cache: 'no-store' },
    );
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

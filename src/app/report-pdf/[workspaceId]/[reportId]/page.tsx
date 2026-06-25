'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
// import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';
import { useReportInfoSuspense } from '@/hooks/report/useReportQuery';
import { createClient } from '@/lib/supabase/client';

export default function ReportPdfPage() {
  // RLS 멤버십 격리 후 anon 으로는 데이터 0건. 백엔드가 호출자 토큰을 ?at=&rt= 로 주입하면
  // setSession 으로 Playwright 컨텍스트를 사용자 신원으로 전환 → 본인 워크스페이스 RLS 통과.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const at = params.get('at');
    const rt = params.get('rt');
    if (at && rt) {
      const supabase = createClient();
      supabase.auth.setSession({ access_token: at, refresh_token: rt })
        .then(() => setReady(true))
        .catch(() => setReady(true));
    } else {
      setReady(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  if (!ready) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <ReportPdfContent />
    </Suspense>
  );
}

function PdfReadyMarker() {
  // Playwright headless 가 PDF 캡처 시점을 알 수 있도록 모든 Suspense 쿼리 해소 후 마커 부착.
  // useSuspenseQuery 가 throw 하면 후속 sibling 도 렌더 안 되므로 이 컴포넌트가 렌더되면 위 섹션들 데이터 모두 도착.
  useEffect(() => {
    document.documentElement.dataset.pdfReady = 'true';
  }, []);
  return null;
}

function ReportPdfContent() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const { data: report } = useReportInfoSuspense(reportId);
  const isDaily = report?.type === 'daily';

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
        <Highlight workspaceId={workspaceId} reportId={reportId} pdfMode />
        <OnlineReputation workspaceId={workspaceId} reportId={reportId} pdfMode />
        {/* 리스크 콘텐츠 관리 섹션 임시 비노출.
        <RiskContent workspaceId={workspaceId} reportId={reportId} pdfMode />
        */}
        {!isDaily && <Strategy workspaceId={workspaceId} reportId={reportId} pdfMode />}
        <PdfReadyMarker />
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';
import { useReportInfoSuspense } from '@/hooks/report/useReportQuery';

export default function ReportPdfPage() {
  // 서버: QueryClient 캐시 비어있어 Loading fallback / 클라이언트: 기존 세션 캐시로 즉시 렌더
  // → hydration mismatch 방지 위해 mount 전까지 서버와 동일하게 Loading 만 렌더
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect
  if (!mounted) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <ReportPdfContent />
    </Suspense>
  );
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
        {!isDaily && <TopContent workspaceId={workspaceId} reportId={reportId} />}
        <RiskContent workspaceId={workspaceId} reportId={reportId} pdfMode />
        {!isDaily && <Strategy workspaceId={workspaceId} reportId={reportId} pdfMode />}
      </div>
    </div>
  );
}

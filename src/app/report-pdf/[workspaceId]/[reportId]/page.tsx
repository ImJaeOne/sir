'use client';

import { useParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';

export default function ReportPdfPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();

  if (isFetching > 0) return <Loading text="보고서 준비 중" />;

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <Highlight workspaceId={workspaceId} reportId={reportId} pdfMode />
        <OnlineReputation workspaceId={workspaceId} reportId={reportId} pdfMode />
        <TopContent workspaceId={workspaceId} />
        <RiskContent workspaceId={workspaceId} />
        <Strategy workspaceId={workspaceId} reportId={reportId} />
      </div>
    </div>
  );
}

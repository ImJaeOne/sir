'use client';

import { useParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';

export default function ReportPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();

  if (isFetching > 0) return <Loading text="보고서 준비 중" />;

  return (
    <div className="px-10 py-10 bg-bg-light">
      <div className="mx-auto w-[1200px] flex flex-col gap-10">
        <ReportHeader workspaceId={workspaceId} reportId={reportId} />
        <Highlight workspaceId={workspaceId} reportId={reportId} />
        <OnlineReputation workspaceId={workspaceId} reportId={reportId} />
        <TopContent workspaceId={workspaceId} />
        <RiskContent workspaceId={workspaceId} />
        <Strategy workspaceId={workspaceId} reportId={reportId} />
      </div>
    </div>
  );
}

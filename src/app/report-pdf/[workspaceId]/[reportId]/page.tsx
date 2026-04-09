'use client';

import { useParams } from 'next/navigation';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';

export default function ReportPdfPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;

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

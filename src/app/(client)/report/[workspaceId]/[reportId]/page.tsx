'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';

export default function ClientReportPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();

  // 첫 fetch 완료 여부 추적: sections를 항상 mount해서 쿼리를 발사하되,
  // 첫 fetch가 끝날 때까지는 invisible로 숨김 (DOM 유지 → scroll 위치 보존)
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    if (isFetching === 0 && startedRef.current) setReady(true);
  }, [isFetching]);

  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-0 z-50 bg-bg-light min-h-screen">
          <Loading text="보고서 준비 중" />
        </div>
      )}
      <div className={`px-10 py-10 bg-bg-light ${ready ? '' : 'invisible'}`}>
        <div className="mx-auto w-[1200px] flex flex-col gap-10">
          <section id="section-highlight" className="flex flex-col gap-10">
            <ReportHeader workspaceId={workspaceId} reportId={reportId} />
            <Highlight workspaceId={workspaceId} reportId={reportId} />
          </section>
          <OnlineReputation workspaceId={workspaceId} reportId={reportId} />
          <TopContent workspaceId={workspaceId} />
          <RiskContent workspaceId={workspaceId} />
          <Strategy workspaceId={workspaceId} reportId={reportId} />
        </div>
      </div>
    </div>
  );
}

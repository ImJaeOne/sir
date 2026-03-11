'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StagePanel } from '@/components/ui/StagePanel';
import { PIPELINE_STAGES } from '@/constants/pipeline';
import type { StageId, StageStatus } from '@/types/pipeline';

const STAGE_IDS: StageId[] = ['crawling', 'analysis', 'content', 'report', 'email'];

function buildInitialStatuses(step: StageId | null, allCompleted: boolean): Record<StageId, StageStatus> {
  const statuses: Record<StageId, StageStatus> = {
    crawling: 'idle',
    analysis: 'idle',
    content: 'idle',
    report: 'idle',
    email: 'idle',
  };

  if (allCompleted) {
    STAGE_IDS.forEach((id) => { statuses[id] = 'completed'; });
    return statuses;
  }

  if (!step || !STAGE_IDS.includes(step)) return statuses;

  const stepIndex = STAGE_IDS.indexOf(step);
  STAGE_IDS.forEach((id, i) => {
    if (i < stepIndex) statuses[id] = 'completed';
  });

  return statuses;
}

export default function PipelinePage() {
  return (
    <Suspense>
      <PipelineContent />
    </Suspense>
  );
}

function PipelineContent() {
  const router = useRouter();
  const params = useParams();
  const contextId = params?.contextId as string;
  const searchParams = useSearchParams();
  const initialStep = (searchParams?.get('step') as StageId | null) ?? null;
  const isCompleted = searchParams?.get('completed') === 'true';

  const [stageStatuses, setStageStatuses] = useState<Record<StageId, StageStatus>>(() =>
    buildInitialStatuses(initialStep, isCompleted)
  );
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const updateStep = useCallback(
    (stageId: StageId) => {
      const p = new URLSearchParams(searchParams?.toString());
      p.set('step', stageId);
      router.replace(`/dashboard/${contextId}?${p.toString()}`, { scroll: false });
    },
    [router, contextId, searchParams]
  );

  useEffect(() => {
    const step = searchParams?.get('step') as StageId | null;
    if (step && STAGE_IDS.includes(step)) {
      setTimeout(() => {
        stageRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchParams]);

  const handleStart = (stageId: StageId) => {
    updateStep(stageId);
    setStageStatuses((prev) => ({ ...prev, [stageId]: 'loading' }));
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      setStageStatuses((prev) => ({ ...prev, [stageId]: 'completed' }));
      const nextIndex = STAGE_IDS.indexOf(stageId) + 1;
      if (nextIndex < STAGE_IDS.length) {
        const nextId = STAGE_IDS[nextIndex];
        updateStep(nextId);
        setTimeout(() => {
          stageRefs.current[nextId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }, 1500);
  };

  const frontierIndex = (() => {
    const idx = STAGE_IDS.findIndex((id) => stageStatuses[id] !== 'completed');
    return idx === -1 ? STAGE_IDS.length : idx;
  })();

  const allCompleted = frontierIndex === STAGE_IDS.length;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <DashboardHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
          {PIPELINE_STAGES.map((stage, index) => (
            <div
              key={stage.id}
              ref={(el) => {
                stageRefs.current[stage.id] = el;
              }}
            >
              <StagePanel
                stage={stage}
                index={index}
                status={stageStatuses[stage.id]}
                locked={index > frontierIndex}
                onStart={() => handleStart(stage.id)}
              />
            </div>
          ))}

          {allCompleted && (
            <div className="text-center py-6 sm:py-8">
              <p className="text-green-600 font-semibold text-sm sm:text-base">
                모든 단계가 완료되었습니다.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

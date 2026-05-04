'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTriggerPipeline } from '@/hooks/crawl/usePipelineMutation';
import { getErrorMessage } from '@/lib/utils';

interface StartAnalysisButtonProps {
  workspaceId: string;
  reportId: string;
  /** 외부 사유로 비활성화하고 싶을 때 (예: 이미 진행 중) */
  disabled?: boolean;
  size?: 'sm' | 'md';
}

// API 응답은 즉시 200 이고 백엔드는 그 후 lock 대기. 그 동안 사용자가 두/세번 더 클릭하면
// 모두 통과해 같은 보고서에 sessions/pipeline_runs 가 중복 적재됨 (audit H9). 성공 후
// progress query 가 sessions 를 반영해 부모가 unmount 시켜줄 때까지 낙관적 잠금을 유지.
const JUST_STARTED_LOCK_MS = 30_000;

export function StartAnalysisButton({
  workspaceId,
  reportId,
  disabled,
  size = 'md',
}: StartAnalysisButtonProps) {
  const [justStarted, setJustStarted] = useState(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = useTriggerPipeline();

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const handleStart = async () => {
    try {
      await trigger.mutateAsync({ workspaceId, reportId, triggeredBy: 'manual' });
      toast.success('분석을 시작했습니다.');
      setJustStarted(true);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => setJustStarted(false), JUST_STARTED_LOCK_MS);
    } catch (e) {
      toast.error(getErrorMessage(e, '분석 시작에 실패했습니다.'));
    }
  };

  const sizeClass =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-5 py-2.5 text-sm rounded-xl';

  const isLocked = trigger.isPending || justStarted;
  return (
    <button
      onClick={handleStart}
      disabled={isLocked || disabled}
      className={`bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass}`}
    >
      {trigger.isPending ? '시작 중...' : justStarted ? '시작됨' : disabled ? '분석 진행 중' : '분석 시작'}
    </button>
  );
}

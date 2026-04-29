'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workspaceKeys } from '@/hooks/workspace/workspaceKeys';
import { createClient } from '@/lib/supabase/client';
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
  const [loading, setLoading] = useState(false);
  const [justStarted, setJustStarted] = useState(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('인증이 필요합니다.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          report_id: reportId,
          triggered_by: 'manual',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail ?? '분석 시작 실패');
      }

      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
      toast.success('분석을 시작했습니다.');
      setJustStarted(true);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => setJustStarted(false), JUST_STARTED_LOCK_MS);
    } catch (e) {
      toast.error(getErrorMessage(e, '분석 시작에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const sizeClass =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-5 py-2.5 text-sm rounded-xl';

  const isLocked = loading || justStarted;
  return (
    <button
      onClick={handleStart}
      disabled={isLocked || disabled}
      className={`bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass}`}
    >
      {loading ? '시작 중...' : justStarted ? '시작됨' : disabled ? '분석 진행 중' : '분석 시작'}
    </button>
  );
}

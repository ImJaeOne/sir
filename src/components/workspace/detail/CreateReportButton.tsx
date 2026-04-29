'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workspaceKeys } from '@/hooks/workspace/workspaceKeys';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/utils';

interface CreateReportButtonProps {
  workspaceId: string;
}

export function CreateReportButton({ workspaceId }: CreateReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    if (!isMonday) {
      toast.error('보고서는 매주 월요일에 생성할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('인증이 필요합니다.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? '보고서 생성 실패');
      }

      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
      toast.success(`보고서가 생성되었습니다. (${data.period_start} ~ ${data.period_end})`);
    } catch (e) {
      toast.error(getErrorMessage(e, '보고서 생성에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '생성 중...' : '보고서 생성'}
    </button>
  );
}

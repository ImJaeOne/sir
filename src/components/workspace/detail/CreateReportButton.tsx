'use client';

import { toast } from 'sonner';
import { useCreateReport } from '@/hooks/report/useReportMutation';
import { getErrorMessage } from '@/lib/utils';

interface CreateReportButtonProps {
  workspaceId: string;
}

export function CreateReportButton({ workspaceId }: CreateReportButtonProps) {
  const createMutation = useCreateReport(workspaceId);

  const handleCreate = async () => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    if (!isMonday) {
      toast.error('보고서는 매주 월요일에 생성할 수 있습니다.');
      return;
    }

    try {
      const data = await createMutation.mutateAsync();
      toast.success(`보고서가 생성되었습니다. (${data.period_start} ~ ${data.period_end})`);
    } catch (e) {
      toast.error(getErrorMessage(e, '보고서 생성에 실패했습니다.'));
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createMutation.isPending}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {createMutation.isPending ? '생성 중...' : '보고서 생성'}
    </button>
  );
}

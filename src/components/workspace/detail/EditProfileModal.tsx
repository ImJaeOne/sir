'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUpdateWorkspaceProfile } from '@/hooks/workspace/useWorkspaceMutation';
import { getErrorMessage } from '@/lib/utils';
import type { WorkspaceProfile } from '@/types/workspace';

interface EditProfileModalProps {
  workspaceId: string;
  profile: WorkspaceProfile | null;
  onClose: () => void;
}

export function EditProfileModal({ workspaceId, profile, onClose }: EditProfileModalProps) {
  const updateProfile = useUpdateWorkspaceProfile(workspaceId);
  const initialIndustry = profile?.industry ?? '';
  const initialSummary = profile?.business_summary ?? '';
  const [industry, setIndustry] = useState(initialIndustry);
  const [businessSummary, setBusinessSummary] = useState(initialSummary);

  const hasChanges =
    industry.trim() !== initialIndustry || businessSummary.trim() !== initialSummary;

  const handleSave = () => {
    if (!hasChanges) return;
    updateProfile.mutate(
      {
        industry: industry.trim() || null,
        business_summary: businessSummary.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('저장되었습니다.');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, '저장에 실패했습니다.')),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="회사 프로필 수정"
      titleAccessory={<Tooltip text="AI 분석의 정확도 향상을 위한 필드입니다." />}
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={updateProfile.isPending}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateProfile.isPending}
            className="flex-1"
          >
            {updateProfile.isPending ? '저장 중...' : '저장'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          업종
        </label>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="예: 게임, 반도체, 바이오"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          사업 개요
        </label>
        <textarea
          value={businessSummary}
          onChange={(e) => setBusinessSummary(e.target.value)}
          placeholder="주요 사업 내용, 매출 구조, 자회사 등"
          rows={7}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-y min-h-[180px] max-h-[320px]"
        />
      </div>
    </Modal>
  );
}

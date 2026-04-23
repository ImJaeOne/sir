'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';
import { useUpdateWorkspaceProfile } from '@/hooks/workspace/useWorkspaceMutation';
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

  const handleSave = async () => {
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
        onError: () => toast.error('저장에 실패했습니다.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-slate-800">회사 프로필 수정</h2>
            <Tooltip text="AI 분석의 정확도 향상을 위한 필드입니다." />
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 overflow-y-auto">
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
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-y min-h-[96px] max-h-[200px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateProfile.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:shadow-none"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

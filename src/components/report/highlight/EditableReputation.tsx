'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { cn } from '@/lib/utils';
import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckListIcon } from '@/components/icons/CheckListIcon';
import { ReputationIcon } from '@/components/icons/ReputationIcon';
import { DynamicsIcon } from '@/components/icons/DynamicsIcon';
import { MomentumIcon } from '@/components/icons/MomentumIcon';
import { LiskIcon } from '@/components/icons/LiskIcon';
import { useUpdateSummary } from '@/hooks/report/useReportMutation';
import type { SummarySection } from '@/lib/api/reportApi';

const SUMMARY_SECTIONS = [
  {
    label: '평판 분석',
    icon: ReputationIcon,
    bg: 'bg-bg-blue',
    borderColor: 'border-blue-400',
  },
  {
    label: '채널별 평판 분석',
    icon: DynamicsIcon,
    bg: 'bg-bg-pupple-15',
    borderColor: 'border-purple-400',
  },
  {
    label: '긍정 여론 분석',
    icon: MomentumIcon,
    bg: 'bg-bg-green-15',
    borderColor: 'border-emerald-400',
  },
  {
    label: '부정 여론 분석',
    icon: LiskIcon,
    bg: 'bg-bg-danger',
    borderColor: 'border-red-400',
  },
];

interface EditableReputationProps {
  summary: SummarySection[];
  workspaceId: string;
  reportId: string;
  isInitial?: boolean;
}

export function EditableReputation({ summary, workspaceId, reportId, isInitial = false }: EditableReputationProps) {
  const title = isInitial ? '월간 총평' : '주간 총평';
  const [editing, setEditing] = useState(false);
  const [sections, setSections] = useState<SummarySection[]>(summary);
  const [activeTab, setActiveTab] = useState(0);
  const mutation = useUpdateSummary(workspaceId, reportId);

  const startEdit = () => {
    setSections(JSON.parse(JSON.stringify(summary)));
    setEditing(true);
  };

  const cancel = () => {
    setSections(summary);
    setEditing(false);
  };

  const save = () => {
    mutation.mutate(sections, { onSuccess: () => setEditing(false) });
  };

  const updateSummary = useCallback((sIdx: number, value: string) => {
    setSections((prev) => prev.map((s, i) => (i === sIdx ? { ...s, summary: value } : s)));
  }, []);

  const updateSubTitle = useCallback((sIdx: number, subIdx: number, value: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              subsections: s.subsections.map((sub, j) =>
                j === subIdx ? { ...sub, title: value } : sub
              ),
            }
          : s
      )
    );
  }, []);

  const updatePoint = useCallback((sIdx: number, subIdx: number, pIdx: number, value: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              subsections: s.subsections.map((sub, j) =>
                j === subIdx
                  ? {
                      ...sub,
                      points: sub.points.map((p, k) => (k === pIdx ? value : p)),
                    }
                  : sub
              ),
            }
          : s
      )
    );
  }, []);

  const addPoint = useCallback((sIdx: number, subIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              subsections: s.subsections.map((sub, j) =>
                j === subIdx
                  ? {
                      ...sub,
                      points: [...sub.points, ''],
                    }
                  : sub
              ),
            }
          : s
      )
    );
  }, []);

  const removePoint = useCallback((sIdx: number, subIdx: number, pIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              subsections: s.subsections.map((sub, j) =>
                j === subIdx
                  ? {
                      ...sub,
                      points: sub.points.filter((_, k) => k !== pIdx),
                    }
                  : sub
              ),
            }
          : s
      )
    );
  }, []);

  const data = editing ? sections : summary;
  const hasChanges = JSON.stringify(sections) !== JSON.stringify(summary);

  const actionButton = editing ? (
    <div className="flex items-center gap-2">
      <AdminButton variant="secondary" onClick={cancel}>
        취소
      </AdminButton>
      <AdminButton variant="primary" onClick={save} disabled={mutation.isPending || !hasChanges}>
        {mutation.isPending ? '저장 중...' : '저장'}
      </AdminButton>
    </div>
  ) : (
    <AdminButton variant="secondary" onClick={startEdit}>
      수정
    </AdminButton>
  );

  if (!data || data.length === 0) {
    return (
      <ReportSubSection title={title} action={actionButton}>
        <ReportCard px={20} py={5}>
          <EmptyState message={'총평 데이터가 없습니다.\n총평 생성을 실행해주세요.'} />
        </ReportCard>
      </ReportSubSection>
    );
  }

  const activeSection = data[activeTab];
  const activeConfig = SUMMARY_SECTIONS[activeTab];

  return (
    <ReportSubSection title={title} action={actionButton}>
      <ReportCard px={0} py={0}>
        <div className="flex flex-col">
          {/* 탭 — 모바일 가로 스크롤 */}
          <div className="flex border-b border-slate-100 overflow-x-auto overflow-y-hidden">
            {SUMMARY_SECTIONS.map((sec, i) => {
              const Icon = sec.icon;
              const active = activeTab === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    'shrink-0 lg:flex-1 flex items-center justify-center gap-2 px-4 lg:px-0 py-3 lg:py-4 transition-colors cursor-pointer border-b-2',
                    active ? sec.borderColor : 'border-transparent hover:bg-slate-50'
                  )}
                >
                  <div className={cn('p-1 lg:p-1.5 rounded-md', active ? sec.bg : '')}>
                    <Icon size={14} />
                  </div>
                  <span
                    className={cn(
                      'text-xs lg:text-sm whitespace-nowrap',
                      active ? 'text-slate-700 font-semibold' : 'text-slate-400'
                    )}
                  >
                    {sec.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 콘텐츠 */}
          <div className="p-4 lg:p-8">
            {/* 섹션 헤더 */}
            <div className="flex items-center gap-3 mb-5">
              {activeConfig?.icon &&
                (() => {
                  const Icon = activeConfig.icon;
                  return (
                    <div className={cn('p-2.5 rounded-lg', activeConfig.bg)}>
                      <Icon size={20} />
                    </div>
                  );
                })()}
              <span className="text-sm font-semibold text-slate-700">
                {activeConfig?.label ?? `섹션 ${activeTab + 1}`}
              </span>
            </div>

            {/* 섹션 요약 */}
            {editing ? (
              <textarea
                value={activeSection.summary}
                onChange={(e) => updateSummary(activeTab, e.target.value)}
                className="w-full text-sm font-semibold text-text-dark border border-border-light rounded-lg px-3 py-2 outline-none focus:border-slate-400 resize-none mb-4"
                rows={2}
              />
            ) : (
              <p className="text-sm font-semibold text-text-dark mb-4">{activeSection.summary}</p>
            )}

            {/* 서브섹션 */}
            <div className="flex flex-col gap-3">
              {activeSection.subsections.map((sub, subIdx) => (
                <div
                  key={subIdx}
                  className="rounded-[10px] bg-bg-light px-4 py-3 lg:px-5 lg:py-4 flex flex-col gap-2"
                >
                  {editing ? (
                    <input
                      value={sub.title}
                      onChange={(e) => updateSubTitle(activeTab, subIdx, e.target.value)}
                      className="w-full min-w-0 text-sm font-semibold text-text-dark bg-white border border-border-light rounded-lg px-3 py-1.5 outline-none focus:border-slate-400"
                    />
                  ) : (
                    <h5 className="text-sm font-semibold text-text-dark">{sub.title}</h5>
                  )}
                  <ul className="flex flex-col gap-1.5">
                    {sub.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex gap-2 min-w-0">
                        <CheckListIcon
                          size={16}
                          className={`shrink-0 ${editing ? 'mt-2' : 'mt-0.5'}`}
                        />
                        {editing ? (
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <input
                              value={point}
                              onChange={(e) => updatePoint(activeTab, subIdx, pIdx, e.target.value)}
                              className="flex-1 min-w-0 text-sm text-text-muted bg-white border border-border-light rounded-lg px-3 py-1.5 outline-none focus:border-slate-400"
                            />
                            <button
                              onClick={() => removePoint(activeTab, subIdx, pIdx)}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted leading-relaxed">{point}</span>
                        )}
                      </li>
                    ))}
                    {editing && (
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => addPoint(activeTab, subIdx)}
                        className="w-full mt-1 flex items-center justify-center gap-1"
                      >
                        <Plus size={14} />
                        항목 추가
                      </AdminButton>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ReportCard>
    </ReportSubSection>
  );
}

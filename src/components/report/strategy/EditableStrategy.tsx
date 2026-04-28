'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { cn } from '@/lib/utils';
import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckListIcon } from '@/components/icons/CheckListIcon';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';
import { useUpdateStrategies } from '@/hooks/report/useReportMutation';
import type { StrategyGroup, StrategyData } from '@/lib/api/reportApi';

const CHANNEL_TABS = [
  { key: 'news', label: '뉴스', icon: NewsIcon, bg: 'bg-bg-blue', borderColor: 'border-blue-400' },
  {
    key: 'sns',
    label: 'SNS',
    icon: BlogIcon,
    bg: 'bg-bg-pupple-15',
    borderColor: 'border-purple-400',
  },
  {
    key: 'community',
    label: '커뮤니티',
    icon: CommunityIcon,
    bg: 'bg-bg-green-15',
    borderColor: 'border-emerald-400',
  },
];

interface EditableStrategyProps {
  strategies: StrategyGroup[];
  workspaceId: string;
  reportId: string;
  channelDesc: string;
}

export function EditableStrategy({ strategies, workspaceId, reportId, channelDesc }: EditableStrategyProps) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<StrategyGroup[]>(strategies);
  const [activeTab, setActiveTab] = useState(0);
  const mutation = useUpdateStrategies(workspaceId, reportId);

  const startEdit = () => {
    setData(JSON.parse(JSON.stringify(strategies)));
    setEditing(true);
  };

  const cancel = () => {
    setData(strategies);
    setEditing(false);
  };

  const save = () => {
    mutation.mutate(data, { onSuccess: () => setEditing(false) });
  };

  const update = useCallback((category: string, updater: (s: StrategyData) => StrategyData) => {
    setData((prev) =>
      prev.map((g) => (g.category === category ? { ...g, strategy: updater(g.strategy) } : g))
    );
  }, []);

  const items = editing ? data : strategies;
  const hasChanges = JSON.stringify(data) !== JSON.stringify(strategies);
  const availableTabs = CHANNEL_TABS.filter((t) => items.some((s) => s.category === t.key));
  const activeKey = availableTabs[activeTab]?.key;
  const activeStrategy = items.find((s) => s.category === activeKey);
  const activeConfig = availableTabs[activeTab];

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

  if (items.length === 0) {
    return (
      <ReportSubSection title="채널별 대응 전략" description={channelDesc} action={actionButton}>
        <EmptyState message={'전략 데이터가 없습니다.\n전략 생성을 실행해주세요.'} />
      </ReportSubSection>
    );
  }

  return (
    <ReportSubSection title="채널별 대응 전략" description={channelDesc} action={actionButton}>
      <ReportCard px={0} py={0}>
        <div className="flex flex-col">
          {/* 탭 */}
          <div className="flex border-b border-slate-100">
            {availableTabs.map((tab, i) => {
              const Icon = tab.icon;
              const active = activeTab === i;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 lg:py-4 transition-colors cursor-pointer border-b-2',
                    active ? tab.borderColor : 'border-transparent hover:bg-slate-50'
                  )}
                >
                  <div className={cn('p-1 lg:p-1.5 rounded-md', active ? tab.bg : '')}>
                    <Icon size={14} />
                  </div>
                  <span
                    className={cn(
                      'text-xs lg:text-sm',
                      active ? 'text-slate-700 font-semibold' : 'text-slate-400'
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 콘텐츠 */}
          {activeStrategy && activeConfig && (
            <div className="p-5 lg:p-8">
              {/* 섹션 헤더 */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn('p-2.5 rounded-lg', activeConfig.bg)}>
                  <activeConfig.icon size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {activeConfig.label} 채널
                </span>
              </div>

              {/* 전략 도출 배경 */}
              <SectionBlock title="전략 도출 배경">
                <EditableText
                  editing={editing}
                  value={activeStrategy.strategy.background.summary}
                  onChange={(v) =>
                    update(activeKey, (s) => ({
                      ...s,
                      background: { ...s.background, summary: v },
                    }))
                  }
                  bold
                />
                <PointsList
                  editing={editing}
                  points={activeStrategy.strategy.background.points}
                  onUpdate={(pIdx, v) =>
                    update(activeKey, (s) => ({
                      ...s,
                      background: {
                        ...s.background,
                        points: s.background.points.map((p, k) => (k === pIdx ? v : p)),
                      },
                    }))
                  }
                  onAdd={() =>
                    update(activeKey, (s) => ({
                      ...s,
                      background: { ...s.background, points: [...s.background.points, ''] },
                    }))
                  }
                  onRemove={(pIdx) =>
                    update(activeKey, (s) => ({
                      ...s,
                      background: {
                        ...s.background,
                        points: s.background.points.filter((_, k) => k !== pIdx),
                      },
                    }))
                  }
                />
              </SectionBlock>

              {/* 핵심 전략 제안 */}
              <SectionBlock
                title="핵심 전략 제안"
                bg="bg-bg-blue"
                textColor="text-text-dark"
                border="border border-bg-accent"
                className="mt-4"
              >
                <EditableText
                  editing={editing}
                  value={activeStrategy.strategy.proposal.summary}
                  onChange={(v) =>
                    update(activeKey, (s) => ({ ...s, proposal: { ...s.proposal, summary: v } }))
                  }
                  bold
                />
                {activeStrategy.strategy.proposal.actions.map((action, aIdx) => (
                  <div key={aIdx} className="mt-3">
                    <EditableText
                      editing={editing}
                      value={`[${action.platform}] ${action.topic}`}
                      onChange={(v) => {
                        const match = v.match(/^\[(.+?)\]\s*(.*)$/);
                        update(activeKey, (s) => ({
                          ...s,
                          proposal: {
                            ...s.proposal,
                            actions: s.proposal.actions.map((a, k) =>
                              k === aIdx
                                ? {
                                    ...a,
                                    platform: match?.[1] ?? a.platform,
                                    topic: match?.[2] ?? v,
                                  }
                                : a
                            ),
                          },
                        }));
                      }}
                      bold
                      className="text-text-accent"
                    />
                    <PointsList
                      editing={editing}
                      points={action.contents}
                      textColor="text-text-dark"
                      onUpdate={(pIdx, v) =>
                        update(activeKey, (s) => ({
                          ...s,
                          proposal: {
                            ...s.proposal,
                            actions: s.proposal.actions.map((a, k) =>
                              k === aIdx
                                ? {
                                    ...a,
                                    contents: a.contents.map((c, j) => (j === pIdx ? v : c)),
                                  }
                                : a
                            ),
                          },
                        }))
                      }
                      onAdd={() =>
                        update(activeKey, (s) => ({
                          ...s,
                          proposal: {
                            ...s.proposal,
                            actions: s.proposal.actions.map((a, k) =>
                              k === aIdx
                                ? {
                                    ...a,
                                    contents: [...a.contents, ''],
                                  }
                                : a
                            ),
                          },
                        }))
                      }
                      onRemove={(pIdx) =>
                        update(activeKey, (s) => ({
                          ...s,
                          proposal: {
                            ...s.proposal,
                            actions: s.proposal.actions.map((a, k) =>
                              k === aIdx
                                ? {
                                    ...a,
                                    contents: a.contents.filter((_, j) => j !== pIdx),
                                  }
                                : a
                            ),
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </SectionBlock>

            </div>
          )}
        </div>
      </ReportCard>
    </ReportSubSection>
  );
}

// ── 헬퍼 컴포넌트 ──

function SectionBlock({
  title,
  bg,
  textColor,
  border,
  className,
  children,
}: {
  title: string;
  bg?: string;
  textColor?: string;
  border?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-[10px] px-5 py-4 flex flex-col gap-2', bg ?? 'bg-bg-light', border, className)}>
      <h4 className="text-sm font-bold text-text-accent">{title}</h4>
      <div className={textColor}>{children}</div>
    </div>
  );
}

function EditableText({
  editing,
  value,
  onChange,
  bold,
  className,
}: {
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  bold?: boolean;
  className?: string;
}) {
  if (editing) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm text-text-dark bg-white border border-border-light rounded-lg px-3 py-2 outline-none focus:border-slate-400 resize-none"
        rows={2}
      />
    );
  }
  return <p className={cn('text-sm', bold && 'font-medium', className)}>{value}</p>;
}

function PointsList({
  editing,
  points,
  onUpdate,
  onAdd,
  onRemove,
  textColor = 'text-text-muted',
}: {
  editing: boolean;
  points: string[];
  onUpdate: (idx: number, value: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  textColor?: string;
}) {
  return (
    <ul className="flex flex-col gap-1.5 mt-1">
      {points.map((point, i) => (
        <li key={i} className="flex gap-2 min-w-0">
          <CheckListIcon size={16} className={`shrink-0 ${editing ? 'mt-2' : 'mt-0.5'}`} />
          {editing ? (
            <div className="flex-1 min-w-0 flex items-center gap-1">
              <input
                value={point}
                onChange={(e) => onUpdate(i, e.target.value)}
                className="flex-1 min-w-0 text-sm text-text-dark bg-white border border-border-light rounded-lg px-3 py-1.5 outline-none focus:border-slate-400"
              />
              <button
                onClick={() => onRemove(i)}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 p-1 hover:bg-red-50 rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <span className={cn('text-sm leading-relaxed', textColor)}>{point}</span>
          )}
        </li>
      ))}
      {editing && (
        <AdminButton
          variant="secondary"
          size="sm"
          onClick={onAdd}
          className="w-full mt-1 flex items-center justify-center gap-1"
        >
          <Plus size={14} />
          항목 추가
        </AdminButton>
      )}
    </ul>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Md } from '@/components/ui/Markdown';
import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { Divider } from '@/components/ui/Divider';
import { ReputationIcon } from '@/components/icons/ReputationIcon';
import { DynamicsIcon } from '@/components/icons/DynamicsIcon';
import { MomentumIcon } from '@/components/icons/MomentumIcon';
import { LiskIcon } from '@/components/icons/LiskIcon';
import type { SummarySection } from '@/lib/api/reportApi';

const SUMMARY_SECTIONS = [
  { label: 'SIR 지수 및\n시장 지위 평가', icon: ReputationIcon, bg: 'bg-bg-blue' },
  { label: '채널별 여론\n다이내믹스', icon: DynamicsIcon, bg: 'bg-bg-pupple-15' },
  { label: '긍정 모멘텀 분석', icon: MomentumIcon, bg: 'bg-bg-green-15' },
  { label: '리스크 분석', icon: LiskIcon, bg: 'bg-bg-danger' },
];

function SummaryAccordion({ sections }: { sections: SummarySection[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col px-2 gap-2">
      {sections.map((section, i) => (
        <div key={i}>
          <div className="overflow-hidden">
            <div className="flex items-start gap-8 py-5">
              <div className="flex gap-3 shrink-0 items-center">
                {SUMMARY_SECTIONS[i]?.icon &&
                  (() => {
                    const Icon = SUMMARY_SECTIONS[i].icon;
                    return (
                      <div className={cn('p-2.5 rounded-lg', SUMMARY_SECTIONS[i].bg)}>
                        <Icon size={20} />
                      </div>
                    );
                  })()}
                <div className="w-[130px] whitespace-pre-line text-sm text-text-muted font-semibold">
                  {SUMMARY_SECTIONS[i]?.label ?? `섹션 ${i + 1}`}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex justify-between items-center text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-semibold text-text-dark">{section.summary}</p>
                  {openIdx === i ? (
                    <ChevronUp size={18} className="text-slate-400 shrink-0 ml-3" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 shrink-0 ml-3" />
                  )}
                </button>
                {openIdx === i && (
                  <div className="mt-3">
                    <Md type="reputation">{section.detail}</Md>
                  </div>
                )}
              </div>
            </div>
          </div>
          {i < sections.length - 1 ? <Divider /> : null}
        </div>
      ))}
    </div>
  );
}

export function Reputation({ summary }: { summary: SummarySection[] }) {
  return (
    <ReportSubSection title="이번 주 총평">
      <ReportCard px={20} py={5}>
        {summary && summary.length > 0 ? (
          <SummaryAccordion sections={summary} />
        ) : (
          <EmptyState message={'총평 데이터가 없습니다.\n총평 생성을 실행해주세요.'} />
        )}
      </ReportCard>
    </ReportSubSection>
  );
}

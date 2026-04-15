'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Divider } from '@/components/ui/Divider';
import { CheckListIcon } from '@/components/icons/CheckListIcon';
import { ReputationIcon } from '@/components/icons/ReputationIcon';
import { DynamicsIcon } from '@/components/icons/DynamicsIcon';
import { MomentumIcon } from '@/components/icons/MomentumIcon';
import { LiskIcon } from '@/components/icons/LiskIcon';
import type { SummarySection } from '@/lib/api/reportApi';

const SUMMARY_SECTIONS = [
  { label: '평판 분석', icon: ReputationIcon, bg: 'bg-bg-blue' },
  { label: '채널별 분석', icon: DynamicsIcon, bg: 'bg-bg-pupple-15' },
  { label: '긍정 모멘텀 분석', icon: MomentumIcon, bg: 'bg-bg-green-15' },
  { label: '리스크 분석', icon: LiskIcon, bg: 'bg-bg-danger' },
];

export function SummaryAccordion({ sections }: { sections: SummarySection[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col px-2 gap-2">
      {sections.map((section, i) => (
        <div key={i}>
          <div className="overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-8 py-5">
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
                <div className="lg:w-[130px] whitespace-pre-line text-sm text-text-muted font-semibold">
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
                  <div className="mt-3 flex flex-col gap-3">
                    {section.subsections.map((sub, j) => (
                      <div
                        key={j}
                        className="rounded-[10px] bg-bg-light px-5 py-4 flex flex-col gap-2"
                      >
                        <h5 className="text-sm font-semibold text-text-dark">{sub.title}</h5>
                        <ul className="flex flex-col gap-1.5">
                          {sub.points.map((point, k) => (
                            <li key={k} className="flex gap-2">
                              <CheckListIcon size={16} className="shrink-0 mt-0.5" />
                              <span className="text-sm text-text-muted leading-relaxed">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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

'use client';

import { CheckListIcon } from '@/components/icons/CheckListIcon';
import type { StrategyData } from '@/lib/api/reportApi';
import { toDisplayPlatform } from '@/components/report/strategy/platformLabel';

interface StrategySectionsProps {
  strategy: StrategyData;
}

function SectionBlock({
  title,
  bg,
  textColor,
  border,
  children,
}: {
  title: string;
  bg: string;
  textColor: string;
  border?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm lg:text-sm font-bold text-text-accent">{title}</h4>
      <div className={`rounded-xl px-4 py-3 lg:px-5 lg:py-4 ${bg} ${border ?? ''}`}>
        <div className={`text-[14px] lg:text-sm leading-relaxed ${textColor}`}>{children}</div>
      </div>
    </div>
  );
}

export function StrategySections({ strategy }: StrategySectionsProps) {
  const { background, proposal } = strategy;

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* 전략 도출 배경 */}
      <SectionBlock title="전략 도출 배경" bg="bg-bg-light" textColor="text-text-dark">
        <p className="font-medium mb-2 text-text-dark">{background.summary}</p>
        <ul className="flex flex-col gap-1">
          {background.points.map((point, i) => (
            <li key={i} className="flex gap-2">
              <CheckListIcon size={16} className="shrink-0 mt-0.5" />
              <span className="text-text-dark">{point}</span>
            </li>
          ))}
        </ul>
      </SectionBlock>

      {/* 핵심 전략 제안 */}
      <SectionBlock
        title="핵심 전략 제안"
        bg="bg-bg-blue"
        textColor="text-text-dark"
        border="border border-bg-accent"
      >
        <p className="text-text-accent font-medium mb-3">{proposal.summary}</p>
        <div className="flex flex-col gap-3">
          {proposal.actions.map((action, i) => (
            <div key={i}>
              <p className="font-bold text-text-accent mb-1 text-[14px] lg:text-sm">
                [{toDisplayPlatform(action.platform)}] {action.topic}
              </p>
              <ul className="flex flex-col gap-1">
                {action.contents.map((content, j) => (
                  <li key={j} className="flex gap-2">
                    <CheckListIcon size={16} color="#362cff" className="shrink-0 mt-0.5" />
                    <span className="text-text-dark">{content}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

'use client';

import { CheckListIcon } from '@/components/icons/CheckListIcon';
import type { StrategyData } from '@/lib/api/reportApi';

interface StrategySectionsProps {
  strategy: StrategyData;
}

function SectionBlock({
  title,
  bg,
  textColor,
  children,
}: {
  title: string;
  bg: string;
  textColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-bold text-text-accent">{title}</h4>
      <div className={`rounded-xl px-5 py-4 ${bg}`}>
        <div className={`text-sm leading-relaxed ${textColor}`}>{children}</div>
      </div>
    </div>
  );
}

export function StrategySections({ strategy }: StrategySectionsProps) {
  const { background, proposal, effect } = strategy;

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* 전략 도출 배경 */}
      <SectionBlock title="전략 도출 배경" bg="bg-bg-light" textColor="text-text-dark">
        <p className="font-medium mb-2">{background.summary}</p>
        <ul className="flex flex-col gap-1">
          {background.points.map((point, i) => (
            <li key={i} className="flex items-center gap-2">
                              <CheckListIcon size={16} />
                              <span className="text-text-sub">{point}</span>
                            </li>
          ))}
        </ul>
      </SectionBlock>

      {/* 핵심 전략 제안 */}
      <SectionBlock title="핵심 전략 제안" bg="bg-bg-accent" textColor="text-white">
        <p className="font-medium mb-3">{proposal.summary}</p>
        <div className="flex flex-col gap-3">
          {proposal.actions.map((action, i) => (
            <div key={i}>
              <p className="font-bold mb-1">[{action.platform}] {action.topic}</p>
              <ul className="flex flex-col gap-1">
                {action.contents.map((content, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <CheckListIcon size={16} color="white" />
                    <span className="text-white/90">{content}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* 기대 효과 */}
      <SectionBlock title="기대 효과" bg="bg-bg-light" textColor="text-text-dark">
        <p className="font-medium mb-2">{effect.summary}</p>
        <ul className="flex flex-col gap-1">
          {effect.points.map((point, i) => (
            <li key={i} className="flex items-center gap-2">
                              <CheckListIcon size={16} />
                              <span className="text-text-sub">{point}</span>
                            </li>
          ))}
        </ul>
      </SectionBlock>
    </div>
  );
}

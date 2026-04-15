'use client';
'use no memo';

import { useState, useEffect, useRef } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useActiveSection } from '@/hooks/client/useActiveSection';
import { SirSymbol } from '@/components/icons/SirSymbol';
import { HighlightSidebarIcon } from '@/components/icons/HighlightSidebarIcon';
import { OnlineReputationSidebarIcon } from '@/components/icons/OnlineReputationSidebarIcon';
import { TopContentSidebarIcon } from '@/components/icons/TopContentSidebarIcon';
import { RiskContentSidebarIcon } from '@/components/icons/RiskContentSidebarIcon';
import { StrategySidebarIcon } from '@/components/icons/StrategySidebarIcon';

const SECTIONS = [
  { id: 'section-highlight', label: '주간 하이라이트', Icon: HighlightSidebarIcon },
  { id: 'section-reputation', label: '온라인 평판 종합', Icon: OnlineReputationSidebarIcon },
  { id: 'section-top-content', label: '채널별 상위 콘텐츠', Icon: TopContentSidebarIcon },
  { id: 'section-risk', label: '리스크 콘텐츠 관리', Icon: RiskContentSidebarIcon },
  { id: 'section-strategy', label: '대응 전략 제안', Icon: StrategySidebarIcon },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function MobileFab() {
  const [isOpen, setIsOpen] = useState(false);
  const activeId = useActiveSection(SECTION_IDS, 'client-main');

  const isFetching = useIsFetching();
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFetching === 0 && startedRef.current) setReady(true);
  }, [isFetching]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setIsOpen(false);
  };

  if (!ready) return null;

  const activeIdx = SECTIONS.findIndex((s) => s.id === activeId);

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 lg:hidden">
      {/* 섹션 목록 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />
          <div className="relative z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100/80 py-1.5 w-fit overflow-hidden">
            {SECTIONS.map(({ id, label, Icon }, i) => {
              const active = activeIdx === i;
              return (
                <button
                  key={id}
                  onClick={() => handleClick(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all cursor-pointer relative"
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-bg-accent" />
                  )}
                  <Icon size={16} color={active ? '#362CFF' : '#828EA6'} />
                  <span className={`text-xs font-medium ${active ? 'text-text-accent' : 'text-text-muted'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* FAB 버튼 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="z-50 w-14 h-14 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
      >
        {isOpen ? (
          <X size={20} className="text-slate-500" />
        ) : (
          <SirSymbol size={22} />
        )}
      </button>
    </div>
  );
}

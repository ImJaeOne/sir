'use client';
'use no memo';

import { useState, useEffect, useRef, useCallback } from 'react';
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

const FAB_SIZE = 56;

export function MobileFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const activeId = useActiveSection(SECTION_IDS, 'client-main');

  const isFetching = useIsFetching();
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFetching === 0 && startedRef.current) setReady(true);
  }, [isFetching]);

  // 초기 위치: 우하단
  useEffect(() => {
    if (!initialized) {
      setPos({ x: window.innerWidth - FAB_SIZE - 20, y: window.innerHeight - FAB_SIZE - 24 });
      setInitialized(true);
    }
  }, [initialized]);

  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(8, Math.min(x, window.innerWidth - FAB_SIZE - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - FAB_SIZE - 8)),
  }), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosX: pos.x, startPosY: pos.y, moved: false };
  }, [pos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    const next = clamp(dragRef.current.startPosX + dx, dragRef.current.startPosY + dy);
    setPos(next);
  }, [clamp]);

  const handleTouchEnd = useCallback(() => {
    if (dragRef.current && !dragRef.current.moved) {
      setIsOpen((v) => !v);
    }
    dragRef.current = null;
  }, []);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setIsOpen(false);
  };

  if (!ready || !initialized) return null;

  const activeIdx = SECTIONS.findIndex((s) => s.id === activeId);

  return (
    <>
      {/* 섹션 목록 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100/80 py-1.5 w-fit overflow-hidden lg:hidden"
            style={{
              left: Math.min(pos.x, window.innerWidth - 200),
              ...(pos.y < window.innerHeight / 2
                ? { top: pos.y + FAB_SIZE + 8 }
                : { top: pos.y - 8 - SECTIONS.length * 42 }),
            }}
          >
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

      {/* FAB 버튼 — 드래그 가능 */}
      <button
        ref={fabRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="fixed z-50 w-14 h-14 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center cursor-pointer lg:hidden touch-none"
        style={{ left: pos.x, top: pos.y }}
      >
        {isOpen ? (
          <X size={20} className="text-slate-500" />
        ) : (
          <SirSymbol size={22} />
        )}
      </button>
    </>
  );
}

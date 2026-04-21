'use client';

import { useState, useRef, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useReportInfo } from '@/hooks/report/useReportQuery';
import { SirSymbol } from '@/components/icons/SirSymbol';
import { getClientReportSections } from '@/components/client/sidebar/sections';

const FAB_SIZE = 56;

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

export function MobileFab() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reportId = (params?.reportId as string | undefined) ?? '';
  const { data: report } = useReportInfo(reportId);
  const isDaily = report?.type === 'daily';

  const sections = useMemo(() => getClientReportSections(isDaily), [isDaily]);
  const activeId = searchParams?.get('section') ?? sections[0]?.id;

  const [isOpen, setIsOpen] = useState(false);
  // SSR 은 '0x0' 을 반환해 초기 렌더를 (0,0) 로 고정하고, 클라이언트 마운트 후 실제 뷰포트로 동기화.
  const viewport = useSyncExternalStore(
    subscribeResize,
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => '0x0',
  );
  const [vw, vh] = viewport.split('x').map(Number);
  const mounted = vw > 0;
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const pos = dragPos ?? { x: vw - FAB_SIZE - 20, y: vh - FAB_SIZE - 24 };
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

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
    setDragPos(next);
  }, [clamp]);

  const handleTouchEnd = useCallback(() => {
    if (dragRef.current && !dragRef.current.moved) {
      setIsOpen((v) => !v);
    }
    dragRef.current = null;
  }, []);

  const handleClick = (id: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    next.set('section', id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const activeIdx = sections.findIndex((s) => s.id === activeId);

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
                : { top: pos.y - 8 - sections.length * 42 }),
            }}
          >
            {sections.map(({ id, label, Icon }, i) => {
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

      {/* FAB 버튼 — 드래그 가능. mount 전엔 숨겨서 hydration mismatch 방지. */}
      <button
        ref={fabRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed z-50 w-14 h-14 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center cursor-pointer lg:hidden touch-none ${
          mounted ? '' : 'opacity-0 pointer-events-none'
        }`}
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

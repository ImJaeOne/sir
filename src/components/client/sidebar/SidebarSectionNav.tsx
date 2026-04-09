'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useActiveSection } from '@/hooks/client/useActiveSection';
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

interface SidebarSectionNavProps {
  isOpen: boolean;
}

export function SidebarSectionNav({ isOpen }: SidebarSectionNavProps) {
  const activeId = useActiveSection(SECTION_IDS, 'client-main');
  const initialScrolledRef = useRef(false);

  // 보고서 첫 로딩 중에는 active 표시를 숨김 (깜빡임 방지)
  const isFetching = useIsFetching();
  const startedFetchingRef = useRef(false);
  const [showActive, setShowActive] = useState(false);
  useEffect(() => {
    if (isFetching > 0) startedFetchingRef.current = true;
    if (isFetching === 0 && startedFetchingRef.current) setShowActive(true);
  }, [isFetching]);

  // 새로고침 시 URL hash → 데이터 로딩 완료 후 해당 섹션으로 스크롤 (한 번만)
  // showActive가 true가 되어야 섹션들이 실제 데이터 기준 높이로 렌더되므로,
  // 그 시점 이후에 scroll해야 정확한 위치로 이동함
  useEffect(() => {
    if (initialScrolledRef.current) return;
    if (!showActive) return;

    const hash = window.location.hash.slice(1);
    if (hash && SECTION_IDS.includes(hash as (typeof SECTION_IDS)[number])) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    initialScrolledRef.current = true;
  }, [showActive]);

  // activeId 변경 시 URL hash 업데이트 (스크롤로 인한 변경 포함)
  useEffect(() => {
    if (!initialScrolledRef.current && window.location.hash) return; // 초기 스크롤 전엔 hash 보존
    if (`#${activeId}` === window.location.hash) return;
    window.history.replaceState(null, '', `#${activeId}`);
  }, [activeId]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    initialScrolledRef.current = true;
  };

  return (
    <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
      {SECTIONS.map(({ id, label, Icon }) => {
        const active = showActive && activeId === id;
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`flex items-center gap-2.5 rounded-lg transition-colors cursor-pointer ${isOpen ? 'px-9 py-4' : 'py-2.5 justify-center'} ${active ? 'bg-bg-accent' : isOpen ? 'bg-bg-light' : ''}`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Icon size={20} color={active ? 'white' : '#828EA6'} />
            </div>
            {isOpen && (
              <span
                className={`text-sm font-medium whitespace-nowrap ${active ? 'text-white' : 'text-text-muted'}`}
              >
                {label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

'use client';

import { useState, useEffect } from 'react';

/**
 * 스크롤 위치에 따라 현재 보이는 섹션 ID를 반환
 * - IntersectionObserver로 root 컨테이너 내 섹션 가시성 추적
 * - MutationObserver로 DOM 변화 감지하여 섹션 노드 교체 시 자동 재attach
 *
 * @param sectionIds 추적할 섹션 ID 배열 (순서대로)
 * @param rootId 스크롤 컨테이너 ID (IntersectionObserver root)
 * @param rootMargin IntersectionObserver rootMargin (기본: '-20% 0px -60% 0px')
 */
export function useActiveSection(
  sectionIds: readonly string[],
  rootId: string,
  rootMargin = '-20% 0px -79% 0px',
) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0]);

  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let observedEls: HTMLElement[] = [];

    const setup = () => {
      const root = document.getElementById(rootId);
      const els = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean) as HTMLElement[];
      if (!root || els.length === 0) return;

      // 이미 같은 노드들을 관찰 중이면 스킵
      if (
        io &&
        observedEls.length === els.length &&
        observedEls.every((el, i) => el === els[i])
      ) {
        return;
      }

      // 이전 observer 정리
      io?.disconnect();

      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          }
        },
        { root, rootMargin, threshold: 0 },
      );

      els.forEach((el) => io!.observe(el));
      observedEls = els;
    };

    setup();

    // DOM 변화를 계속 감지해서 sections가 새로 생기면 observer 재설정
    const mo = new MutationObserver(() => setup());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [sectionIds, rootId, rootMargin]);

  return activeId;
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 워크스페이스별 "마지막으로 본 보고서" 기억.
 * - 다른 페이지(모니터링/위기 등) 갔다가 "보고서" 로 돌아올 때 보던 보고서로 복귀시키기 위함.
 * - in-memory 가 기본(클라이언트 네비게이션 중 유지) + sessionStorage 미러로 새로고침까지 survive.
 *   탭을 닫으면 초기화되어 다음 방문/로그인은 자연스럽게 최신 보고서로 향한다.
 */
interface LastReportState {
  lastReportByWorkspace: Record<string, string>;
  setLastReport: (workspaceId: string, reportId: string) => void;
}

export const useLastReportStore = create<LastReportState>()(
  persist(
    (set) => ({
      lastReportByWorkspace: {},
      setLastReport: (workspaceId, reportId) =>
        set((s) => ({
          lastReportByWorkspace: { ...s.lastReportByWorkspace, [workspaceId]: reportId },
        })),
    }),
    {
      name: 'sir-last-report',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

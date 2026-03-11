import { useKeywordParams } from '@/hooks/useKeywordParams';
import { usePipelineStore } from '@/store/pipeline';

const MOCK_SIR_INDEX = 72;

interface DashboardHeaderProps {
  onOpenSidebar: () => void;
}

export function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const { keywords } = useKeywordParams();
  const analysisStatus = usePipelineStore((s) => s.stageStatuses.analysis);
  const showSirIndex = analysisStatus === 'completed';

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="메뉴 열기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <span className="text-sm text-slate-400 shrink-0">분석 대상</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shrink-0 transition-all duration-500 ${
          showSirIndex ? 'bg-blue-600' : 'bg-slate-100'
        }`}
      >
        <span
          className={`text-xs font-semibold transition-colors hidden sm:inline ${
            showSirIndex ? 'text-blue-100' : 'text-slate-400'
          }`}
        >
          SIR 지수
        </span>
        <span
          className={`text-xs font-semibold transition-colors sm:hidden ${
            showSirIndex ? 'text-blue-100' : 'text-slate-400'
          }`}
        >
          SIR
        </span>
        <span
          className={`text-lg sm:text-xl font-bold transition-colors ${
            showSirIndex ? 'text-white' : 'text-slate-300'
          }`}
        >
          {showSirIndex ? MOCK_SIR_INDEX : '--'}
        </span>
      </div>
    </header>
  );
}

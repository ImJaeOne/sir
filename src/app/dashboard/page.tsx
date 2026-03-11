'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StagePanel } from '@/components/ui/StagePanel';
import { PIPELINE_STAGES } from '@/constants/pipeline';
import type { StageId, StageStatus } from '@/types/pipeline';

const STAGE_IDS: StageId[] = ['crawling', 'analysis', 'content', 'report', 'email'];

const INITIAL_STATUSES: Record<StageId, StageStatus> = {
  crawling: 'idle',
  analysis: 'idle',
  content: 'idle',
  report: 'idle',
  email: 'idle',
};

const MOCK_SIR_INDEX = 72;
const INITIAL_KEYWORDS = ['삼성전자', 'Samsung Electronics'];

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keywords, setKeywords] = useState<string[]>(INITIAL_KEYWORDS);
  const [inputValue, setInputValue] = useState('');
  const [stageStatuses, setStageStatuses] =
    useState<Record<StageId, StageStatus>>(INITIAL_STATUSES);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const updateStep = useCallback(
    (stageId: StageId) => {
      router.replace(`/dashboard?step=${stageId}`, { scroll: false });
    },
    [router]
  );

  // 초기 로드 시 step 파라미터에 해당하는 스테이지로 스크롤
  useEffect(() => {
    const step = searchParams?.get('step') as StageId | null;
    if (step && STAGE_IDS.includes(step)) {
      setTimeout(() => {
        stageRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchParams]);

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setInputValue('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addKeyword();
  };

  const handleStart = (stageId: StageId) => {
    updateStep(stageId);
    setStageStatuses((prev) => ({ ...prev, [stageId]: 'loading' }));
    setTimeout(() => {
      setStageStatuses((prev) => ({ ...prev, [stageId]: 'completed' }));
      const nextIndex = STAGE_IDS.indexOf(stageId) + 1;
      if (nextIndex < STAGE_IDS.length) {
        const nextId = STAGE_IDS[nextIndex];
        updateStep(nextId);
        setTimeout(() => {
          stageRefs.current[nextId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }, 1500);
  };

  const frontierIndex = (() => {
    const idx = STAGE_IDS.findIndex((id) => stageStatuses[id] !== 'completed');
    return idx === -1 ? STAGE_IDS.length : idx;
  })();

  const scrollToStage = (id: StageId) => {
    updateStep(id);
    stageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSidebarOpen(false);
  };

  const showSirIndex = stageStatuses['analysis'] === 'completed';
  const allCompleted = frontierIndex === STAGE_IDS.length;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile/Tablet overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col shrink-0
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-slate-800 font-semibold tracking-tight">SIR</span>
        </div>

        {/* Keyword input */}
        <div className="px-4 py-5 border-b border-slate-100 flex flex-col gap-3 shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">키워드</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="키워드 입력..."
              className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors"
            />
            <button
              onClick={addKeyword}
              className="text-sm bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-bold shrink-0"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw)}
                  className="text-blue-400 hover:text-blue-700 transition-colors cursor-pointer leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Stage progress navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Step</p>
          {PIPELINE_STAGES.map((stage, index) => {
            const isCompleted = stageStatuses[stage.id] === 'completed';
            const isFrontier = index === frontierIndex;
            const isLocked = index > frontierIndex;

            return (
              <button
                key={stage.id}
                onClick={() => scrollToStage(stage.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-colors cursor-pointer ${
                  isFrontier
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : isCompleted
                      ? 'text-slate-600 hover:bg-slate-50'
                      : isLocked
                        ? 'text-slate-300'
                        : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-green-100 text-green-600'
                      : isFrontier
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                {stage.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
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

        {/* All stages — vertical scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
            {PIPELINE_STAGES.map((stage, index) => {
              const isLocked = index > frontierIndex;

              return (
                <div
                  key={stage.id}
                  ref={(el) => { stageRefs.current[stage.id] = el; }}
                >
                  <StagePanel
                    stage={stage}
                    index={index}
                    status={stageStatuses[stage.id]}
                    locked={isLocked}
                    onStart={() => handleStart(stage.id)}
                  />
                </div>
              );
            })}

            {/* All completed message */}
            {allCompleted && (
              <div className="text-center py-6 sm:py-8">
                <p className="text-green-600 font-semibold text-sm sm:text-base">
                  모든 단계가 완료되었습니다.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

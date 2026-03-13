'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_CONTEXTS } from '@/constants/contexts';
import { CompanySearch } from '@/components/ui/CompanySearch';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import type { AnalysisContext, DateRange } from '@/types/context';
import { todayStr, yesterdayStr, formatDateRange } from '@/utils/date';
import { PLATFORMS, PLATFORM_CATEGORIES } from '@/constants/platforms';

export default function DashboardPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  // 회사명
  const [selectedCompany, setSelectedCompany] = useState('');

  // 크롤링 기간
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    start: yesterdayStr(),
    end: todayStr(),
  }));

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() =>
    PLATFORMS.map((p) => p.id)
  );

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryIds = PLATFORMS.filter((p) => p.category === category).map((p) => p.id);
    const allSelected = categoryIds.every((id) => selectedPlatforms.includes(id));
    setSelectedPlatforms((prev) =>
      allSelected
        ? prev.filter((id) => !categoryIds.includes(id))
        : [...new Set([...prev, ...categoryIds])]
    );
  };

  // 컨텍스트명
  const [contextName, setContextName] = useState('');

  // 키워드
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState(false);


  const handleSelect = (ctx: AnalysisContext) => {
    const params = new URLSearchParams();
    params.set('completed', 'true');
    params.set('company', ctx.name);
    params.set('startDate', ctx.dateRange.start);
    params.set('endDate', ctx.dateRange.end);
    if (ctx.keywords.length > 0) {
      params.set('keywords', ctx.keywords.join(','));
    }
    router.push(`/workspace/${ctx.id}?${params.toString()}`);
  };

  const handleCreate = () => {
    if (!selectedCompany.trim() || !contextName.trim()) return;
    // TODO: API로 context 생성 후 반환된 id로 이동
    const newId = `ctx-${Date.now()}`;
    const params = new URLSearchParams();
    params.set('step', 'crawling');
    params.set('contextName', contextName.trim());
    params.set('company', selectedCompany);
    params.set('startDate', dateRange.start);
    params.set('endDate', dateRange.end);
    if (keywords.length > 0) {
      params.set('keywords', keywords.join(','));
    }
    if (selectedPlatforms.length > 0) {
      params.set('platforms', selectedPlatforms.join(','));
    }
    router.push(`/workspace/${newId}?${params.toString()}`);
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setKeywordInput('');
  };

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      addKeyword();
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  return (
    <div className="min-h-0">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">분석 컨텍스트</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            {showCreate ? '취소' : '+ 새로 만들기'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-5 sm:p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-800">새 컨텍스트 생성</h2>

            {/* 컨텍스트명 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                컨텍스트명
              </label>
              <input
                type="text"
                value={contextName}
                onChange={(e) => setContextName(e.target.value)}
                placeholder="예: 삼성전자 3월 감성 분석"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* 회사명 with autocomplete */}
            <CompanySearch value={selectedCompany} onChange={setSelectedCompany} />

            {/* 키워드 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                키워드
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder="키워드 입력 후 Enter"
                  className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  onClick={addKeyword}
                  className="text-sm bg-slate-100 text-slate-600 px-3 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer font-bold shrink-0"
                >
                  +
                </button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
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
              )}
            </div>

            {/* 수집 플랫폼 */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                수집 플랫폼
              </label>
              {PLATFORM_CATEGORIES.map((category) => {
                const items = PLATFORMS.filter((p) => p.category === category);
                const allChecked = items.every((p) => selectedPlatforms.includes(p.id));
                return (
                  <div key={category} className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleCategory(category)}
                        className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">{category}</span>
                    </label>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 ml-5.5">
                      {items.map((platform) => (
                        <label
                          key={platform.id}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform.id)}
                            onChange={() => togglePlatform(platform.id)}
                            className="w-3 h-3 rounded accent-blue-600 cursor-pointer"
                          />
                          <span className="text-xs text-slate-500">{platform.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-end">
              {/* 크롤링 기간 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  크롤링 기간
                </label>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>

              <button
                onClick={handleCreate}
                disabled={!selectedCompany.trim() || !contextName.trim()}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default shrink-0"
              >
                생성
              </button>
            </div>
          </div>
        )}

        {/* Existing contexts */}
        <div className="flex flex-col gap-3">
          {MOCK_CONTEXTS.length === 0 && !showCreate && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">아직 생성된 컨텍스트가 없습니다.</p>
            </div>
          )}
          {MOCK_CONTEXTS.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => handleSelect(ctx)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 flex items-center justify-between gap-4 hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex flex-col gap-2 min-w-0">
                <h3 className="text-base font-semibold text-slate-800 truncate">{ctx.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-50 text-slate-500 text-xs px-2 py-0.5 rounded-full border border-slate-200">
                    {formatDateRange(ctx.dateRange)}
                  </span>
                  {ctx.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-slate-400">{ctx.createdAt}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  완료
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-slate-400"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

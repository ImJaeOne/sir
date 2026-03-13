'use client';

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { getCompanies } from '@/lib/api/krxApi';
import type { KrxCompany } from '@/lib/api/krxApi';

type SearchType = 'name' | 'code';

interface CompanySearchProps {
  onChange: (company: string) => void;
}

export function CompanySearch({ onChange }: CompanySearchProps) {
  const [input, setInput] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('name');
  const [results, setResults] = useState<KrxCompany[]>([]);
  const [selected, setSelected] = useState<KrxCompany | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const items = await getCompanies(trimmed, searchType);
      setResults(items);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      search();
    }
  };

  const handleSelect = (company: KrxCompany) => {
    onChange(company.name);
    setSelected(company);
    setInput(`${company.name} (${company.ticker})`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange('');
    setSelected(null);
    setInput('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">회사명</label>

      {/* 검색 타입 토글 */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setSearchType('name')}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
            searchType === 'name'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          회사명 또는 종목명
        </button>
        <button
          type="button"
          onClick={() => setSearchType('code')}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
            searchType === 'code'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          종목코드
        </button>
      </div>

      {/* 검색 입력 + 결과 드롭다운 */}
      <div className="relative" ref={containerRef}>
        {selected ? (
          <div className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">{selected.name}</span>
              <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                {selected.market}
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                {selected.ticker}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              disabled={loading}
              placeholder={
                searchType === 'name' ? '회사명 또는 종목명 입력 후 Enter' : '종목코드 입력 후 Enter'
              }
              className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-default"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading || !input.trim()}
              className="shrink-0 bg-slate-100 text-slate-600 px-3 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              {loading ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="animate-spin"
                >
                  <path d="M8 1.5a6.5 6.5 0 1 1-6.5 6.5" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5L14 14" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* 드롭다운 결과 */}
        {showDropdown && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">검색 중...</div>
            ) : results.length > 0 ? (
              results.map((company) => (
                <button
                  key={company.isinCd}
                  onClick={() => handleSelect(company)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{company.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                      {company.market}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{company.ticker}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

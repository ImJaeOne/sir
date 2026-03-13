'use client';

import { useState, useRef, useEffect } from 'react';
import { MOCK_COMPANIES } from '@/constants/companies';

interface CompanySearchProps {
  value: string;
  onChange: (company: string) => void;
}

export function CompanySearch({ value, onChange }: CompanySearchProps) {
  const [input, setInput] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions =
    input.length > 0 && !value
      ? MOCK_COMPANIES.filter(
          (c) => c.name.includes(input) || c.ticker.includes(input)
        )
      : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    setInput(name);
    setShowSuggestions(false);
    onChange(name);
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    onChange('');
    setShowSuggestions(true);
  };

  const selectedTicker = MOCK_COMPANIES.find((c) => c.name === value)?.ticker;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        회사명
      </label>
      <div className="relative" ref={containerRef}>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => input.length > 0 && !value && setShowSuggestions(true)}
          placeholder="회사명 또는 종목코드 검색"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((company) => (
              <button
                key={company.ticker}
                onClick={() => handleSelect(company.name)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer text-left"
              >
                <span className="font-medium text-slate-800">{company.name}</span>
                <span className="text-xs text-slate-400">{company.ticker}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {value && (
        <div className="flex items-center gap-1.5">
          <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
            {value}
          </span>
          <span className="text-xs text-slate-400">{selectedTicker}</span>
        </div>
      )}
    </div>
  );
}

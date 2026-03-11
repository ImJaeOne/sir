import { useState, type KeyboardEvent } from 'react';
import { useKeywordParams } from '@/hooks/useKeywordParams';

export function KeywordInput() {
  const { keywords, addKeyword, removeKeyword } = useKeywordParams();
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleAdd = () => {
    addKeyword(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="px-4 py-5 border-b border-slate-100 flex flex-col gap-3 shrink-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">키워드</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="키워드 입력..."
          className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors"
        />
        <button
          onClick={handleAdd}
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
  );
}

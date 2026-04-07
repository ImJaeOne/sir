'use client';

import { useState } from 'react';

interface BlacklistEditorProps {
  title: string;
  description: string;
  placeholder: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}

export function BlacklistEditor({ title, description, placeholder, items, onAdd, onRemove }: BlacklistEditorProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const v = input.trim();
    if (!v || items.includes(v)) return;
    onAdd(v);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {title}
      </label>
      <p className="text-[11px] text-slate-400">{description}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          추가
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-medium"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="hover:text-red-900 cursor-pointer ml-0.5"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

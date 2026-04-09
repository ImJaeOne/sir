'use client';

const SENTIMENT_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'positive', label: '긍정' },
  { key: 'neutral', label: '중립' },
  { key: 'negative', label: '부정' },
] as const;

interface SentimentFilterProps {
  value: string;
  onChange: (key: string) => void;
  counts?: Record<string, number>;
}

export function SentimentFilter({ value, onChange, counts }: SentimentFilterProps) {
  return (
    <div className="flex gap-4 mt-1 border-b border-border-light">
      {SENTIMENT_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <div
            className={`text-xs transition-colors px-2 ${
              value === f.key ? 'text-text-dark font-semibold' : 'text-text-muted font-normal'
            }`}
          >
            {f.label}
            {counts && ` (${counts[f.key] ?? 0})`}
          </div>
          <div
            className={`h-0.5 w-full rounded-full transition-colors ${
              value === f.key ? 'bg-text-accent' : 'bg-transparent'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

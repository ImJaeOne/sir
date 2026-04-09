export function SentimentTag({ sentiment }: { sentiment: string }) {
  const config: Record<string, { label: string; className: string }> = {
    positive: { label: '긍정', className: 'bg-emerald-50 text-emerald-700' },
    neutral: { label: '중립', className: 'bg-slate-100 text-slate-600' },
    negative: { label: '부정', className: 'bg-red-50 text-red-700' },
  };
  const { label, className } = config[sentiment] ?? config.neutral;
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${className}`}>{label}</span>;
}

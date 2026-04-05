'use client';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'slate' | 'violet' | 'amber';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  blue: 'text-blue-600 bg-blue-50 border-blue-100',
  green: 'text-green-700 bg-green-50 border-green-100',
  yellow: 'text-yellow-700 bg-yellow-50 border-yellow-100',
  red: 'text-red-700 bg-red-50 border-red-100',
  slate: 'text-slate-500 bg-slate-100 border-slate-200',
  violet: 'text-violet-600 bg-violet-50 border-violet-100',
  amber: 'text-amber-700 bg-amber-50 border-amber-100',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function CompanyBadge({ companyName }: { companyName: string }) {
  return <Badge variant="blue">{companyName}</Badge>;
}

export function TickerBadge({ ticker }: { ticker: string }) {
  return <Badge variant="violet">{ticker}</Badge>;
}

export function KeywordBadge({ keyword }: { keyword: string }) {
  return <Badge variant="amber">{keyword}</Badge>;
}

export function SirBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const variant: BadgeVariant = score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';
  return (
    <Badge variant={variant} className="font-bold">
      SIR {score}
    </Badge>
  );
}

export function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <Badge variant="slate">
      {count.toLocaleString()}건 {label}
    </Badge>
  );
}

export function SirLevelBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const config = score >= 70
    ? { label: '양호', variant: 'green' as BadgeVariant }
    : score >= 50
    ? { label: '안정', variant: 'yellow' as BadgeVariant }
    : score >= 30
    ? { label: '주의', variant: 'amber' as BadgeVariant }
    : { label: '위험', variant: 'red' as BadgeVariant };
  return <Badge variant={config.variant}>SIR {score}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    crawling: { label: '크롤링 중', variant: 'blue' },
    analyzing: { label: '분석 중', variant: 'amber' },
    clustering: { label: '클러스터링 중', variant: 'violet' },
    done: { label: '완료', variant: 'green' },
    failed: { label: '실패', variant: 'red' },
  };
  const { label, variant } = config[status] ?? { label: status, variant: 'slate' as BadgeVariant };
  return <Badge variant={variant}>{label}</Badge>;
}

export function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  const config = {
    positive: { label: '긍정', variant: 'green' as BadgeVariant },
    neutral: { label: '중립', variant: 'slate' as BadgeVariant },
    negative: { label: '부정', variant: 'red' as BadgeVariant },
  };
  const { label, variant } = config[sentiment];
  return (
    <Badge variant={variant} className="font-bold">
      {label}
    </Badge>
  );
}

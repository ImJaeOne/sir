import type { WeeklyPillState, ReportHealth } from '@/utils/workspace';

export const WEEKLY_PILL_STYLES: Record<WeeklyPillState, { bg: string; border: string; text: string; dot: string }> = {
  done:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-500',   dot: 'bg-slate-300' },
  failed:  { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500' },
  running: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400 animate-pulse' },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: '작업 전',       color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-100'   },
  crawling:   { label: '크롤링 중',     color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
  analyzing:  { label: '분석 중',       color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-100'   },
  clustering: { label: '클러스터링 중', color: 'text-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-100'  },
  done:       { label: '완료',          color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  failed:     { label: '실패',          color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-100'     },
};

export const STATUS_FALLBACK = STATUS_CONFIG.pending;

export const HEALTH_STRIPE: Record<ReportHealth, string> = {
  empty:   'bg-slate-200',
  failed:  'bg-red-400',
  running: 'bg-amber-400',
  done:    'bg-emerald-400',
  pending: 'bg-slate-200',
};

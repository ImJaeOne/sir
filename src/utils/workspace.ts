import type { Report, ReportProgress } from '@/lib/api/workspaceApi';

export type WeeklyPillState = 'done' | 'pending' | 'failed' | 'running';
export type ReportHealth = 'empty' | 'failed' | 'running' | 'done' | 'pending';

export const WEEKDAYS_KR = ['월', '화', '수', '목', '금', '토', '일'] as const;

export const WEEKLY_PLATFORMS = ['naver_news', 'naver_blog', 'youtube', 'naver_stock'] as const;

export const ALL_PLATFORMS = ['naver_news', 'naver_blog', 'youtube', 'naver_stock'];

export const WEEKLY_PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
};

export const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

export const FAILED_REASON_LABELS: Record<string, string> = {
  collect: '수집 실패',
  save: '저장 실패',
  analyze: '분석 실패',
  calculate: '계산 실패',
};

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function deriveDayState(daily: Report | undefined, progress: ReportProgress | undefined): WeeklyPillState {
  if (!daily) return 'pending';
  if (daily.status === 'published') return 'done';
  const sessions = progress?.sessions ?? [];
  if (sessions.some((s) => s.status === 'failed')) return 'failed';
  if (sessions.some((s) => ['crawling', 'pending_analysis', 'analyzing', 'clustering', 'pending'].includes(s.status))) return 'running';
  if (sessions.length > 0 && sessions.every((s) => s.status === 'done')) return 'done';
  return 'pending';
}

export function strategyState(s: ReportProgress['strategies'][number] | undefined): WeeklyPillState {
  if (!s) return 'pending';
  if (s.status === 'done') return 'done';
  if (s.status === 'failed') return 'failed';
  if (s.status === 'analyzing') return 'running';
  return 'pending';
}

type RoundSession = ReportProgress['allSessions'][number] | undefined;

export function deriveRoundState(sessions: RoundSession[]): { state: WeeklyPillState; doneCount: number; failedCount: number } {
  const present = sessions.filter((s): s is ReportProgress['allSessions'][number] => !!s);
  const doneCount = present.filter((s) => s.status === 'done').length;
  const failedCount = present.filter((s) => s.status === 'failed').length;
  let state: WeeklyPillState;
  if (present.length === 0) state = 'pending';
  else if (failedCount > 0 && doneCount + failedCount === sessions.length) state = 'failed';
  else if (doneCount === sessions.length) state = 'done';
  else state = 'running';
  return { state, doneCount, failedCount };
}

export function platformSessionState(s: RoundSession): WeeklyPillState {
  if (!s) return 'pending';
  if (s.status === 'done') return 'done';
  if (s.status === 'failed') return 'failed';
  if (['crawling', 'analyzing', 'clustering', 'pending_analysis', 'pending'].includes(s.status)) return 'running';
  return 'pending';
}

export function getReportHealth(progress: ReportProgress | undefined): ReportHealth {
  if (!progress || progress.sessions.length === 0) return 'empty';
  const statuses = progress.sessions.map((s) => s.status);
  if (statuses.some((s) => s === 'failed')) return 'failed';
  if (statuses.some((s) => ['pending', 'crawling', 'pending_analysis', 'analyzing', 'clustering'].includes(s))) return 'running';
  if (statuses.every((s) => s === 'done')) return 'done';
  return 'pending';
}

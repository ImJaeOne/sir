import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Subscription } from '@/lib/api/subscriptionApi';

export type ContractStatus = 'active' | 'expiring' | 'expired' | 'none';

export interface ContractSummary {
  status: ContractStatus;
  /** 오늘 기준 종료일까지 남은 일수. 무기한이거나 구독 없으면 null */
  daysUntilExpiry: number | null;
}

/** 활성 구독 하나를 받아 계약 상태와 남은 일수를 판정 */
export function getContractSummary(
  sub: Subscription | null | undefined,
): ContractSummary {
  if (!sub) return { status: 'none', daysUntilExpiry: null };
  if (!sub.ended_at) return { status: 'active', daysUntilExpiry: null };

  const end = parseISO(sub.ended_at);
  const days = differenceInCalendarDays(end, new Date());

  if (days < 0) return { status: 'expired', daysUntilExpiry: days };
  if (days <= 7) return { status: 'expiring', daysUntilExpiry: days };
  return { status: 'active', daysUntilExpiry: days };
}

export const CONTRACT_STATUS_STYLE: Record<ContractStatus, { label: string; className: string }> = {
  active: { label: '활성', className: 'bg-emerald-50 text-emerald-700' },
  expiring: { label: '만료 임박', className: 'bg-red-50 text-red-700' },
  expired: { label: '만료', className: 'bg-slate-100 text-slate-400' },
  none: { label: '구독 없음', className: 'bg-slate-100 text-slate-400' },
};

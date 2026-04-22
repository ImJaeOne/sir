'use client';

import { format, parseISO } from 'date-fns';
import { TIER_LABELS } from '@/types/subscription';
import { getContractSummary, CONTRACT_STATUS_STYLE } from '@/lib/subscription';
import type { UserWithDetails } from '@/lib/api/userApi';

interface CustomerTableProps {
  users: UserWithDetails[];
  onSelect: (userId: string) => void;
}

export function CustomerTable({ users, onSelect }: CustomerTableProps) {
  // 종료일 빠른 순: 종료일 있는 것 먼저 (이른 순) → 무기한/구독 없음 뒤로
  const sorted = [...users].sort((a, b) => {
    const aEnd = a.subscription?.ended_at ?? null;
    const bEnd = b.subscription?.ended_at ?? null;
    if (!aEnd && !bEnd) return 0;
    if (!aEnd) return 1;
    if (!bEnd) return -1;
    return parseISO(aEnd).getTime() - parseISO(bEnd).getTime();
  });

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* 데스크톱 테이블 헤더 */}
      <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_0.8fr_1.5fr_0.7fr_0.8fr] border-b border-slate-100 py-3 px-4 text-xs font-semibold text-slate-500">
        <div>회사명</div>
        <div>이메일</div>
        <div className="text-center">티어</div>
        <div className="text-center">계약 기간</div>
        <div className="text-center">남은</div>
        <div className="text-center">상태</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">등록된 사용자가 없습니다.</p>
        )}
        {sorted.map((u) => {
          const sub = u.subscription;
          const summary = getContractSummary(sub);
          const style = CONTRACT_STATUS_STYLE[summary.status];
          const periodLabel = sub
            ? `${format(parseISO(sub.started_at), 'yy.MM.dd')} ~ ${
                sub.ended_at ? format(parseISO(sub.ended_at), 'yy.MM.dd') : '무기한'
              }`
            : '-';
          const remainLabel =
            summary.daysUntilExpiry === null
              ? '-'
              : summary.daysUntilExpiry < 0
                ? `${summary.daysUntilExpiry}일`
                : `D-${summary.daysUntilExpiry}`;
          const tierLabel = sub ? TIER_LABELS[sub.tier] : '-';

          return (
            <div
              key={u.id}
              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => onSelect(u.id)}
            >
              {/* 데스크톱 행 */}
              <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_0.8fr_1.5fr_0.7fr_0.8fr] items-center py-3 px-4">
                <div className="text-sm font-semibold text-slate-700 truncate">{u.company_name}</div>
                <div className="text-sm text-slate-500 truncate">{u.email}</div>
                <div className="text-center text-xs text-slate-600">{tierLabel}</div>
                <div className="text-center text-xs text-slate-500">{periodLabel}</div>
                <div className="text-center text-xs text-slate-500">{remainLabel}</div>
                <div className="text-center">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${style.className}`}>
                    {style.label}
                  </span>
                </div>
              </div>

              {/* 모바일 카드 */}
              <div className="lg:hidden flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 truncate">{u.company_name}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {tierLabel}
                    </span>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${style.className}`}>
                    {style.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">{u.email}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                  <span>{periodLabel}</span>
                  <span className="text-slate-200">·</span>
                  <span>{remainLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/Badge';
import { ROLE_LABEL, ROLE_VARIANT } from '@/constants/role';
import type { UserWithDetails } from '@/lib/api/userApi';

interface StaffTableProps {
  users: UserWithDetails[];
  onSelect: (userId: string) => void;
}

export function StaffTable({ users, onSelect }: StaffTableProps) {
  // 가입일 최신 순
  const sorted = [...users].sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* 데스크톱 헤더 */}
      <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_0.8fr_0.8fr_1fr] border-b border-slate-100 py-3 px-4 text-xs font-semibold text-slate-500">
        <div>회사명</div>
        <div>이메일</div>
        <div className="text-center">권한</div>
        <div className="text-center">담당 ws</div>
        <div className="text-center">가입일</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">등록된 관리자가 없습니다.</p>
        )}
        {sorted.map((u) => (
          <div
            key={u.id}
            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
            onClick={() => onSelect(u.id)}
          >
            {/* 데스크톱 행 */}
            <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_0.8fr_0.8fr_1fr] items-center py-3 px-4">
              <div className="text-sm font-semibold text-slate-700 truncate">{u.company_name}</div>
              <div className="text-sm text-slate-500 truncate">{u.email}</div>
              <div className="text-center">
                <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
              </div>
              <div className="text-center text-xs text-slate-500">{u.workspaceCount}</div>
              <div className="text-center text-xs text-slate-400">{u.created_at.slice(0, 10)}</div>
            </div>

            {/* 모바일 카드 */}
            <div className="lg:hidden flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 truncate">{u.company_name}</span>
                <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
              </div>
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                <span>담당 워크스페이스 {u.workspaceCount}</span>
                <span className="text-slate-200">·</span>
                <span>가입 {u.created_at.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

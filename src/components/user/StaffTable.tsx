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
      <div className="grid grid-cols-[1.2fr_1.8fr_0.8fr_0.8fr_1fr] border-b border-slate-100 py-3 px-4 text-xs font-semibold text-slate-500">
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
            className="grid grid-cols-[1.2fr_1.8fr_0.8fr_0.8fr_1fr] items-center py-3 px-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
            onClick={() => onSelect(u.id)}
          >
            <div className="text-sm font-semibold text-slate-700 truncate">
              {u.company_name}
            </div>
            <div className="text-sm text-slate-500 truncate">{u.email}</div>
            <div className="text-center">
              <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
            </div>
            <div className="text-center text-xs text-slate-500">{u.workspaceCount}</div>
            <div className="text-center text-xs text-slate-400">{u.created_at.slice(0, 10)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/Badge';
import { ROLE_LABEL, ROLE_VARIANT } from '@/constants/role';
import type { UserWithDetails } from '@/lib/api/userApi';

interface StaffTableProps {
  users: UserWithDetails[];
  /** 제공되지 않으면 row 클릭 비활성 (일반 admin 에겐 모달 진입 막기 위함) */
  onSelect?: (userId: string) => void;
}

export function StaffTable({ users, onSelect }: StaffTableProps) {
  // 가입일 최신 순
  const sorted = [...users].sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );

  const clickable = typeof onSelect === 'function';

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* 데스크톱 헤더 — 스크롤 컨테이너 안 sticky. 행과 같은 폭(스크롤바 제외)을 공유해 칸 어긋남 방지 */}
        <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_0.8fr_1fr] sticky top-0 z-10 bg-white border-b border-slate-100 py-3 px-4 text-xs font-semibold text-slate-500">
          <div>회사명</div>
          <div>이메일</div>
          <div className="text-center">권한</div>
          <div className="text-center">가입일</div>
        </div>
        {sorted.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">등록된 관리자가 없습니다.</p>
        )}
        {sorted.map((u) => (
          <div
            key={u.id}
            className={`border-b border-slate-50 transition-colors ${
              clickable ? 'hover:bg-slate-50/50 cursor-pointer' : ''
            }`}
            onClick={clickable ? () => onSelect!(u.id) : undefined}
          >
            {/* 데스크톱 행 */}
            <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_0.8fr_1fr] items-center py-3 px-4">
              <div className="text-sm font-semibold text-slate-700 truncate">{u.company_name}</div>
              <div className="text-sm text-slate-500 truncate">{u.email}</div>
              <div className="text-center">
                <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
              </div>
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
                <span>가입 {u.created_at.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

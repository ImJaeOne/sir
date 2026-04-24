'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useWorkspaces, useWorkspacesRealtimeSync } from '@/hooks/workspace/useWorkspaceQuery';
import { AdminLoading } from '@/components/ui/AdminLoading';
import { WorkspaceList } from '@/components/workspace/list/WorkspaceList';
import type { Workspace } from '@/types/workspace';

interface Props {
  // null → 전체 표시 (super_admin), 배열 → 해당 id 만 (admin)
  assignedIds: string[] | null;
}

export function WorkspaceListClient({ assignedIds }: Props) {
  const router = useRouter();
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  const { data: workspaces = [], isPending } = useWorkspaces();
  useWorkspacesRealtimeSync();

  const visibleWorkspaces = useMemo(() => {
    if (assignedIds === null) return workspaces;
    const allowed = new Set(assignedIds);
    return workspaces.filter((ws) => allowed.has(ws.id));
  }, [workspaces, assignedIds]);

  const handleSelect = (ws: Workspace) => {
    router.push(`/workspace/${ws.id}`);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 w-full min-h-full">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">워크스페이스</h1>

      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={workspaceSearch}
          onChange={(e) => setWorkspaceSearch(e.target.value)}
          placeholder="회사명·티커 검색"
          disabled={isPending}
          className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>

      {isPending ? (
        <AdminLoading message="워크스페이스 목록 불러오는 중" />
      ) : visibleWorkspaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 flex flex-col items-center gap-3">
          <p className="text-sm text-slate-400">
            {assignedIds !== null && workspaces.length > 0
              ? '배정된 워크스페이스가 없습니다'
              : '아직 생성된 워크스페이스가 없습니다'}
          </p>
        </div>
      ) : (
        <WorkspaceList
          workspaces={visibleWorkspaces}
          searchQuery={workspaceSearch}
          onSelect={handleSelect}
        />
      )}
    </main>
  );
}

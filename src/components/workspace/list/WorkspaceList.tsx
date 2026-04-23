'use client';

import type { Workspace } from '@/types/workspace';
import { WorkspaceCard, type WorkspaceWithLatest } from './WorkspaceCard';

interface WorkspaceListProps {
  workspaces: WorkspaceWithLatest[];
  searchQuery: string;
  onSelect: (ws: Workspace) => void;
}

export function WorkspaceList({ workspaces, searchQuery, onSelect }: WorkspaceListProps) {
  const isSearching = searchQuery.trim().length > 0;
  const matched = workspaces.filter(
    (ws) => ws.company_name.includes(searchQuery) || ws.ticker.includes(searchQuery),
  );
  const rest = isSearching ? workspaces.filter((ws) => !matched.includes(ws)) : [];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400">총 {workspaces.length}개</p>

      {!isSearching && workspaces.map((ws) => (
        <WorkspaceCard key={ws.id} workspace={ws} onSelect={onSelect} />
      ))}

      {isSearching && (
        <>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              검색 결과{' '}
              <span className="text-slate-400 normal-case tracking-normal">
                ({matched.length}건)
              </span>
            </h3>
            {matched.length > 0 ? (
              matched.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} onSelect={onSelect} />
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">검색 결과가 없습니다</p>
            )}
          </div>
          {rest.length > 0 && (
            <div className="flex flex-col gap-3 mt-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                내 워크스페이스
              </h3>
              {rest.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} onSelect={onSelect} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

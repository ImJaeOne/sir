'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CompanySearch } from '@/components/ui/CompanySearch';
import { Tooltip } from '@/components/ui/Tooltip';
import { useWorkspaces } from '@/hooks/workspace/useWorkspaceQuery';
import { useCreateWorkspace, useDeleteWorkspace } from '@/hooks/workspace/useWorkspaceMutation';
import type { Workspace } from '@/types/workspace';
import { TickerBadge, SirLevelBadge } from '@/components/ui/Badge';


function CreateWorkspaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}) {
  const createWorkspace = useCreateWorkspace();
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; ticker: string } | null>(null);
  const [industry, setIndustry] = useState('');
  const [businessSummary, setBusinessSummary] = useState('');

  const handleCreate = () => {
    if (!selectedCompany) return;

    createWorkspace.mutate(
      {
        company_name: selectedCompany.name,
        ticker: selectedCompany.ticker,
        profile: {
          industry: industry.trim() || undefined,
          business_summary: businessSummary.trim() || undefined,
        },
      },
      {
        onSuccess: (workspace) => {
          toast.success('워크스페이스가 생성되었습니다.');
          onCreated(workspace);
        },
        onError: (error: any) => {
          if (error?.status === 403 || error?.code === '42501') {
            toast.error('관리자 권한이 없습니다.');
          } else {
            toast.error('워크스페이스 생성에 실패했습니다.');
          }
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">새 워크스페이스 생성</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* 회사명 */}
        <CompanySearch onChange={(company) => setSelectedCompany(company)} />

        {/* 회사 프로필 */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              회사 프로필
            </label>
            <Tooltip text="AI 분석의 정확도 향상을 위한 필드입니다." />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">업종</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="예: 게임, 반도체, 바이오"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">사업 개요</label>
            <textarea
              value={businessSummary}
              onChange={(e) => setBusinessSummary(e.target.value)}
              placeholder="주요 사업 내용, 매출 구조, 자회사 등"
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedCompany || createWorkspace.isPending}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);

  const { data: workspaces = [], isLoading } = useWorkspaces();
  const deleteWorkspace = useDeleteWorkspace();

  const handleSelect = (ws: Workspace) => {
    router.push(`/workspace/${ws.id}`);
  };

  return (
    <div className="min-h-0">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">워크스페이스</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            + 새로 만들기
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <CreateWorkspaceModal
            onClose={() => setShowCreate(false)}
            onCreated={(workspace) => {
              setShowCreate(false);
              router.push(`/workspace/${workspace.id}`);
            }}
          />
        )}

        {/* Delete confirm modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
              <h2 className="text-base font-bold text-slate-800">워크스페이스 삭제</h2>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{deleteTarget.company_name}</span> 워크스페이스를 삭제하시겠습니까? 관련된 모든 보고서와 데이터가 삭제됩니다.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    deleteWorkspace.mutate(deleteTarget.id, {
                      onSuccess: () => {
                        toast.success('워크스페이스가 삭제되었습니다.');
                        setDeleteTarget(null);
                      },
                      onError: () => {
                        toast.error('삭제에 실패했습니다.');
                      },
                    });
                  }}
                  disabled={deleteWorkspace.isPending}
                  className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {deleteWorkspace.isPending ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing workspaces */}
        <div className="flex flex-col gap-3">
          {workspaces.length > 0 && (
            <input
              type="text"
              value={workspaceSearch}
              onChange={(e) => setWorkspaceSearch(e.target.value)}
              placeholder="워크스페이스 검색"
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
            />
          )}
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">불러오는 중...</p>
            </div>
          )}
          {!isLoading && workspaces.length === 0 && !showCreate && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">아직 생성된 워크스페이스가 없습니다.</p>
            </div>
          )}
          {(() => {
            const isSearching = workspaceSearch.trim().length > 0;
            const matched = workspaces.filter(
              (ws) => ws.company_name.includes(workspaceSearch) || ws.ticker.includes(workspaceSearch)
            );
            const rest = isSearching ? workspaces.filter((ws) => !matched.includes(ws)) : [];

            const renderCard = (ws: Workspace) => (
              <div
                key={ws.id}
                className="group w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all duration-200"
              >
                <button
                  onClick={() => handleSelect(ws)}
                  className="flex-1 flex items-center gap-4 text-left cursor-pointer min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-800 truncate">{ws.company_name}</h3>
                      <TickerBadge ticker={ws.ticker} />
                      <SirLevelBadge score={ws.sir_score} />
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {(ws as any).latest_report
                        ? `최근 보고서: ${(ws as any).latest_report.period_start.replace(/-/g, '.')} ~ ${(ws as any).latest_report.period_end.replace(/-/g, '.')}`
                        : '보고서 없음'}
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-slate-300 shrink-0"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(ws);
                  }}
                  className="shrink-0 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M6.67 7.33v4M9.33 7.33v4M3.33 4l.67 9.33a1.33 1.33 0 001.33 1.34h5.34a1.33 1.33 0 001.33-1.34L12.67 4" />
                  </svg>
                </button>
              </div>
            );

            if (!isSearching) {
              return workspaces.map(renderCard);
            }

            return (
              <>
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-slate-600">
                    검색 결과 {matched.length}건
                  </h3>
                  {matched.length > 0 ? (
                    matched.map(renderCard)
                  ) : (
                    <p className="text-sm text-slate-400 py-4 text-center">검색 결과가 없습니다</p>
                  )}
                </div>
                {rest.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4">
                    <h3 className="text-sm font-semibold text-slate-600">내 워크스페이스</h3>
                    {rest.map(renderCard)}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}

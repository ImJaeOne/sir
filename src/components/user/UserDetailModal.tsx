'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { addMonths, format, parseISO } from 'date-fns';
import { X, Plus } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ContractPeriodPicker } from '@/components/ui/ContractPeriodPicker';
import { useUpdateUser } from '@/hooks/user/useUserMutation';
import { useActiveSubscription } from '@/hooks/subscription/useSubscriptionQuery';
import { useUpdateSubscriptionPeriod } from '@/hooks/subscription/useSubscriptionMutation';
import { ROLE_LABEL } from '@/constants/role';
import { TIER_LABELS } from '@/types/subscription';
import type { UserProfile, WorkspaceMember } from '@/lib/api/userApi';
import type { Subscription } from '@/lib/api/subscriptionApi';
import type { ProfileRole } from '@/types/auth';

interface UserDetailModalProps {
  user: UserProfile | null;
  myRole: ProfileRole;
  workspaces: { id: string; company_name: string; ticker: string }[];
  members: WorkspaceMember[];
  initialSubscription?: Subscription;
  open: boolean;
  onClose: () => void;
}

export function UserDetailModal({
  user,
  myRole,
  workspaces,
  members,
  initialSubscription,
  open,
  onClose,
}: UserDetailModalProps) {
  const [pendingRole, setPendingRole] = useState<ProfileRole>('user');
  const [pendingWs, setPendingWs] = useState<string[]>([]);

  // subscription 편집 state — 실제 값은 beginEditSub 에서 activeSub 기준으로 초기화
  const [editingSub, setEditingSub] = useState(false);
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(undefined);
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(undefined);

  // workspace 검색 state
  const [wsSearch, setWsSearch] = useState('');

  const updateUser = useUpdateUser();
  const updateSubPeriod = useUpdateSubscriptionPeriod();

  const userWorkspaceId =
    user && user.role === 'user'
      ? members.find((m) => m.profile_id === user.id)?.workspace_id
      : undefined;

  const { data: fetchedSub } = useActiveSubscription(userWorkspaceId);
  const activeSub: Subscription | null =
    fetchedSub !== undefined
      ? (fetchedSub ?? null)
      : (initialSubscription ?? null);

  useEffect(() => {
    if (user) {
      setPendingRole(user.role);
      setPendingWs(
        members.filter((m) => m.profile_id === user.id).map((m) => m.workspace_id),
      );
      setEditingSub(false);
      setNewStartDate(undefined);
      setNewEndDate(undefined);
      setWsSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // "계약 기간 변경" 진입 시 현재 계약 값으로 초기화 (+ 무기한인 경우 1년 뒤로 가정)
  const beginEditSub = () => {
    if (!activeSub) return;
    const started = parseISO(activeSub.started_at);
    const ended = activeSub.ended_at ? parseISO(activeSub.ended_at) : addMonths(started, 12);
    setNewStartDate(started);
    setNewEndDate(ended);
    setEditingSub(true);
  };

  const filteredWs = useMemo(() => {
    if (!wsSearch.trim()) return workspaces;
    const q = wsSearch.toLowerCase();
    return workspaces.filter(
      (ws) =>
        ws.company_name.toLowerCase().includes(q) ||
        ws.ticker.toLowerCase().includes(q),
    );
  }, [workspaces, wsSearch]);

  if (!user) return null;

  const isSuperAdmin = myRole === 'super_admin';
  const isUserRole = user.role === 'user';
  const canEditWorkspace =
    isSuperAdmin || (myRole === 'admin' && user.role === 'user');
  const canEditRole = isSuperAdmin;
  const singleSelect = pendingRole === 'user';

  const currentWs = members
    .filter((m) => m.profile_id === user.id)
    .map((m) => m.workspace_id);

  const roleChanged = pendingRole !== user.role;
  const wsChanged =
    JSON.stringify([...pendingWs].sort()) !==
    JSON.stringify([...currentWs].sort());
  const subChanged = Boolean(
    editingSub && newStartDate && newEndDate && newEndDate > newStartDate && activeSub,
  );

  const handlePeriodChange = ({ start, end }: { start: Date | undefined; end: Date | undefined }) => {
    setNewStartDate(start);
    setNewEndDate(end);
  };

  const hasChanges = isUserRole
    ? roleChanged || subChanged
    : roleChanged || wsChanged;

  const saving = updateUser.isPending || updateSubPeriod.isPending;

  const handleRoleChange = (newRole: ProfileRole) => {
    setPendingRole(newRole);
    if (newRole === 'user' && pendingWs.length > 1) {
      setPendingWs([pendingWs[0]]);
    }
  };

  const handleWorkspaceToggle = (wsId: string) => {
    if (singleSelect) {
      setPendingWs((prev) => (prev.includes(wsId) ? [] : [wsId]));
    } else {
      setPendingWs((prev) =>
        prev.includes(wsId) ? prev.filter((id) => id !== wsId) : [...prev, wsId],
      );
    }
  };

  const handleSave = async () => {
    try {
      if (roleChanged && canEditRole) {
        await updateUser.mutateAsync({
          userId: user.id,
          roleChange: pendingRole,
          wsAdd: [],
          wsRemove: [],
        });
      }
      if (
        isUserRole &&
        subChanged &&
        userWorkspaceId &&
        activeSub &&
        newStartDate &&
        newEndDate
      ) {
        await updateSubPeriod.mutateAsync({
          workspaceId: userWorkspaceId,
          tier: activeSub.tier,
          startedAt: newStartDate.toISOString(),
          endedAt: newEndDate.toISOString(),
        });
      }
      if (!isUserRole && wsChanged && canEditWorkspace) {
        await updateUser.mutateAsync({
          userId: user.id,
          wsAdd: pendingWs.filter((id) => !currentWs.includes(id)),
          wsRemove: currentWs.filter((id) => !pendingWs.includes(id)),
        });
      }
      toast.success('변경사항이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      onClose();
    }
  };

  const assignedWs = filteredWs.filter((ws) => pendingWs.includes(ws.id));
  const unassignedWs = filteredWs.filter((ws) => !pendingWs.includes(ws.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="유저 상세"
      size="md"
      footer={
        <Button onClick={handleSave} disabled={saving || !hasChanges} fullWidth>
          {saving ? '저장 중...' : '수정하기'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-slate-400">회사명</span>
            <p className="text-sm font-semibold text-slate-700">{user.company_name}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">이메일</span>
            <p className="text-sm text-slate-700">{user.email}</p>
          </div>
        </div>

        {canEditRole ? (
          <div>
            <span className="text-xs font-semibold text-slate-600 mb-2 block">권한</span>
            <div className="flex gap-2">
              {(['user', 'admin', 'super_admin'] as ProfileRole[]).map((r) => (
                <AdminButton
                  key={r}
                  variant={pendingRole === r ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleRoleChange(r)}
                  disabled={saving || pendingRole === r}
                >
                  {ROLE_LABEL[r]}
                </AdminButton>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-xs text-slate-400">권한</span>
            <p className="text-sm font-semibold text-slate-700">{ROLE_LABEL[user.role]}</p>
          </div>
        )}

        {isUserRole ? (
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-600 mb-1 block">
                현재 계약
              </span>
              {activeSub ? (
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{TIER_LABELS[activeSub.tier]}</span>
                  {' · '}
                  {format(parseISO(activeSub.started_at), 'yyyy-MM-dd')}
                  {' ~ '}
                  {activeSub.ended_at
                    ? format(parseISO(activeSub.ended_at), 'yyyy-MM-dd')
                    : '무기한'}
                </p>
              ) : (
                <p className="text-sm text-slate-400">활성 구독이 없습니다.</p>
              )}
            </div>

            {activeSub && !editingSub && (
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={beginEditSub}
                disabled={saving}
              >
                계약 기간 변경
              </AdminButton>
            )}

            {activeSub && editingSub && (
              <div className="p-4 bg-slate-50 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">계약 기간 변경</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSub(false);
                      setNewStartDate(undefined);
                      setNewEndDate(undefined);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    취소
                  </button>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">새 계약 기간</label>
                  <ContractPeriodPicker
                    startDate={newStartDate}
                    endDate={newEndDate}
                    onChange={handlePeriodChange}
                    placeholder="시작일 ~ 종료일"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-600">
              워크스페이스 배정
            </span>

            <input
              value={wsSearch}
              onChange={(e) => setWsSearch(e.target.value)}
              placeholder="회사명 또는 종목코드로 검색"
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
            />

            {/* 담당 중 */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                담당 중 ({pendingWs.length}개)
              </span>
              {assignedWs.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto">
                  {assignedWs.map((ws) => (
                    <div
                      key={ws.id}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-slate-700 truncate">{ws.company_name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{ws.ticker}</span>
                      </div>
                      {canEditWorkspace && (
                        <button
                          type="button"
                          onClick={() => handleWorkspaceToggle(ws.id)}
                          disabled={saving}
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-2"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">
                  {wsSearch.trim() ? '검색 결과에 담당 워크스페이스가 없습니다.' : '배정된 워크스페이스가 없습니다.'}
                </p>
              )}
            </div>

            {/* 미배정 */}
            {canEditWorkspace && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                  미배정
                </span>
                {unassignedWs.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto">
                    {unassignedWs.map((ws) => (
                      <div
                        key={ws.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-slate-700 truncate">{ws.company_name}</span>
                          <span className="text-xs text-slate-400 shrink-0">{ws.ticker}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleWorkspaceToggle(ws.id)}
                          disabled={saving}
                          className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer shrink-0 ml-2"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">
                    {wsSearch.trim() ? '검색 결과가 없습니다.' : '모든 워크스페이스가 배정되었습니다.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

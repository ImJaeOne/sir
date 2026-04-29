'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { X, Plus } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ContractPeriodPicker } from '@/components/ui/ContractPeriodPicker';
import { TierPicker } from '@/components/user/TierPicker';
import { useUpdateUser } from '@/hooks/user/useUserMutation';
import { useActiveSubscription } from '@/hooks/subscription/useSubscriptionQuery';
import {
  useChangeSubscriptionTier,
  useExtendSubscription,
  useRenewSubscription,
  usePauseSubscription,
  useCancelSubscription,
  useCorrectSubscription,
} from '@/hooks/subscription/useSubscriptionMutation';
import { ROLE_LABEL } from '@/constants/role';
import { TIER_LABELS, type Tier } from '@/types/subscription';
import type { UserProfile, WorkspaceMember } from '@/lib/api/userApi';
import type { Subscription } from '@/lib/api/subscriptionApi';
import type { ProfileRole } from '@/types/auth';

type SubMode =
  | 'idle'
  | 'change_tier'
  | 'extend'
  | 'pause'
  | 'cancel'
  | 'new'
  | 'correct';

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

  // 구독 작업 mode + 작업별 입력값
  const [subMode, setSubMode] = useState<SubMode>('idle');
  const [formTier, setFormTier] = useState<Tier | undefined>(undefined);
  const [formStart, setFormStart] = useState<Date | undefined>(undefined);
  const [formEnd, setFormEnd] = useState<Date | undefined>(undefined);

  // workspace 검색
  const [wsSearch, setWsSearch] = useState('');

  const updateUser = useUpdateUser();
  const changeTier = useChangeSubscriptionTier();
  const extendSub = useExtendSubscription();
  const renewSub = useRenewSubscription();
  const pauseSub = usePauseSubscription();
  const cancelSub = useCancelSubscription();

  const userWorkspaceId =
    user && user.role === 'user'
      ? members.find((m) => m.profile_id === user.id)?.workspace_id
      : undefined;

  const { data: fetchedSub } = useActiveSubscription(userWorkspaceId);
  const activeSub: Subscription | null =
    fetchedSub !== undefined
      ? (fetchedSub ?? null)
      : (initialSubscription ?? null);

  const correctSub = useCorrectSubscription(userWorkspaceId);

  useEffect(() => {
    if (user) {
      setPendingRole(user.role);
      setPendingWs(
        members.filter((m) => m.profile_id === user.id).map((m) => m.workspace_id),
      );
      resetSubForm();
      setWsSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const resetSubForm = () => {
    setSubMode('idle');
    setFormTier(undefined);
    setFormStart(undefined);
    setFormEnd(undefined);
  };

  const enterMode = (mode: SubMode) => {
    if (mode === 'change_tier' && activeSub) {
      setFormTier(activeSub.tier);
    } else if (mode === 'extend' && activeSub) {
      setFormEnd(parseISO(activeSub.ended_at));
    } else if (mode === 'correct' && activeSub) {
      setFormTier(activeSub.tier);
      setFormStart(parseISO(activeSub.started_at));
      setFormEnd(parseISO(activeSub.ended_at));
    } else if (mode === 'new') {
      const today = new Date();
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(today.getFullYear() + 1);
      setFormTier('black_plus');
      setFormStart(today);
      setFormEnd(oneYearLater);
    }
    setSubMode(mode);
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
  const canEditWorkspace = isSuperAdmin;
  const canEditRole = isSuperAdmin;
  const canEditSub = isSuperAdmin;
  const singleSelect = pendingRole === 'user';

  const currentWs = members
    .filter((m) => m.profile_id === user.id)
    .map((m) => m.workspace_id);

  const roleChanged = pendingRole !== user.role;
  const wsChanged =
    JSON.stringify([...pendingWs].sort()) !==
    JSON.stringify([...currentWs].sort());

  const subBusy =
    changeTier.isPending ||
    extendSub.isPending ||
    renewSub.isPending ||
    pauseSub.isPending ||
    cancelSub.isPending ||
    correctSub.isPending;
  const saving = updateUser.isPending || subBusy;

  // 사용자 역할은 sub 작업이 별도 흐름이므로, 메인 저장은 role 변경만 다룸
  const hasMainChanges = isUserRole ? roleChanged : roleChanged || wsChanged;

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
      if (!isUserRole && wsChanged && canEditWorkspace) {
        await updateUser.mutateAsync({
          userId: user.id,
          wsAdd: pendingWs.filter((id) => !currentWs.includes(id)),
          wsRemove: currentWs.filter((id) => !pendingWs.includes(id)),
        });
      }
      toast.success('변경사항이 저장되었습니다.');
      onClose();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 구독 액션 핸들러 ──

  const formatErr = (e: unknown) =>
    e instanceof Error ? e.message : '실패했습니다.';

  const submitChangeTier = async () => {
    if (!userWorkspaceId || !formTier) return;
    try {
      await changeTier.mutateAsync({
        workspaceId: userWorkspaceId,
        newTier: formTier,
      });
      toast.success('플랜이 변경되었습니다.');
      resetSubForm();
    } catch (e) {
      toast.error(`플랜 변경 실패: ${formatErr(e)}`);
    }
  };

  const submitExtend = async () => {
    if (!userWorkspaceId || !formEnd) return;
    try {
      await extendSub.mutateAsync({
        workspaceId: userWorkspaceId,
        newEndedAt: formEnd.toISOString(),
      });
      toast.success('계약 기간이 연장되었습니다.');
      resetSubForm();
    } catch (e) {
      toast.error(`기간 연장 실패: ${formatErr(e)}`);
    }
  };

  const submitNew = async () => {
    if (!userWorkspaceId || !formTier || !formStart || !formEnd) return;
    try {
      await renewSub.mutateAsync({
        workspaceId: userWorkspaceId,
        newTier: formTier,
        newStartedAt: formStart.toISOString(),
        newEndedAt: formEnd.toISOString(),
      });
      toast.success('새 구독이 등록되었습니다.');
      resetSubForm();
    } catch (e) {
      toast.error(`구독 등록 실패: ${formatErr(e)}`);
    }
  };

  const submitPause = async () => {
    if (!userWorkspaceId) return;
    try {
      await pauseSub.mutateAsync({ workspaceId: userWorkspaceId });
      toast.success('구독이 일시 정지되었습니다.');
      resetSubForm();
    } catch (e) {
      toast.error(`정지 실패: ${formatErr(e)}`);
    }
  };

  const submitCancel = async () => {
    if (!userWorkspaceId) return;
    try {
      await cancelSub.mutateAsync({ workspaceId: userWorkspaceId });
      toast.success('구독이 해지되었습니다.');
      resetSubForm();
    } catch (e) {
      toast.error(`해지 실패: ${formatErr(e)}`);
    }
  };

  const submitCorrect = async () => {
    if (!activeSub || !formTier || !formStart || !formEnd) return;
    try {
      await correctSub.mutateAsync({
        subscriptionId: activeSub.id,
        tier: formTier,
        startedAt: formStart.toISOString(),
        endedAt: formEnd.toISOString(),
      });
      toast.success('구독 정보가 정정되었습니다.');
      resetSubForm();
    } catch (e) {
      toast.error(`정정 실패: ${formatErr(e)}`);
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
        isSuperAdmin && hasMainChanges ? (
          <Button onClick={handleSave} disabled={saving} fullWidth>
            {saving ? '저장 중...' : '권한·워크스페이스 변경 저장'}
          </Button>
        ) : undefined
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

        {canEditRole && !isUserRole ? (
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
                  {format(parseISO(activeSub.ended_at), 'yyyy-MM-dd')}
                </p>
              ) : (
                <p className="text-sm text-slate-400">활성 구독이 없습니다.</p>
              )}
            </div>

            {canEditSub && subMode === 'idle' && activeSub && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <AdminButton size="sm" variant="primary" onClick={() => enterMode('change_tier')}>
                    플랜 변경
                  </AdminButton>
                  <AdminButton size="sm" variant="primary" onClick={() => enterMode('extend')}>
                    기간 연장
                  </AdminButton>
                  <AdminButton size="sm" variant="secondary" onClick={() => enterMode('pause')}>
                    일시 정지
                  </AdminButton>
                  <AdminButton size="sm" variant="secondary" onClick={() => enterMode('cancel')}>
                    해지
                  </AdminButton>
                </div>
                <button
                  type="button"
                  onClick={() => enterMode('correct')}
                  className="text-xs text-slate-500 hover:text-slate-700 self-start cursor-pointer"
                >
                  ✏ 정보 정정 (오타 수정)
                </button>
              </div>
            )}

            {canEditSub && subMode === 'idle' && !activeSub && (
              <AdminButton size="sm" variant="primary" onClick={() => enterMode('new')}>
                새 구독 시작
              </AdminButton>
            )}

            {subMode !== 'idle' && (
              <div className="p-4 bg-slate-50 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {subMode === 'change_tier' && '플랜 변경'}
                    {subMode === 'extend' && '기간 연장'}
                    {subMode === 'pause' && '일시 정지 확인'}
                    {subMode === 'cancel' && '해지 확인'}
                    {subMode === 'new' && '새 구독'}
                    {subMode === 'correct' && '정보 정정'}
                  </span>
                  <button
                    type="button"
                    onClick={resetSubForm}
                    className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    취소
                  </button>
                </div>

                {subMode === 'change_tier' && (
                  <>
                    <p className="text-xs text-slate-500">
                      현재 시점부터 새 플랜으로 변경됩니다. 변경 시점 기준으로 현 계약은
                      종료되고 새 row 가 생성됩니다.
                    </p>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">티어</label>
                      <TierPicker value={formTier} onChange={setFormTier} disabled={subBusy} />
                    </div>
                    <Button onClick={submitChangeTier} disabled={subBusy || !formTier} fullWidth>
                      {subBusy ? '변경 중...' : '플랜 변경 적용'}
                    </Button>
                  </>
                )}

                {subMode === 'extend' && activeSub && (
                  <>
                    <p className="text-xs text-slate-500">
                      현재 종료일{' '}
                      <span className="font-semibold">
                        {format(parseISO(activeSub.ended_at), 'yyyy-MM-dd')}
                      </span>
                      {' '}이후로만 연장 가능합니다.
                    </p>
                    <DateInput value={formEnd} onChange={setFormEnd} disabled={subBusy} label="새 종료일" />
                    <Button onClick={submitExtend} disabled={subBusy || !formEnd} fullWidth>
                      {subBusy ? '연장 중...' : '기간 연장'}
                    </Button>
                  </>
                )}

                {subMode === 'pause' && (
                  <>
                    <p className="text-xs text-slate-700">
                      활성 구독을 즉시 정지합니다. 이후 보고서가 생성되지 않으며,
                      재개하려면 새 구독을 시작해야 합니다.
                    </p>
                    <Button onClick={submitPause} disabled={subBusy} fullWidth>
                      {subBusy ? '정지 중...' : '일시 정지 확인'}
                    </Button>
                  </>
                )}

                {subMode === 'cancel' && (
                  <>
                    <p className="text-xs text-red-700">
                      구독을 즉시 해지합니다. 이후 보고서가 생성되지 않습니다.
                    </p>
                    <Button onClick={submitCancel} disabled={subBusy} fullWidth>
                      {subBusy ? '해지 중...' : '해지 확인'}
                    </Button>
                  </>
                )}

                {subMode === 'new' && (
                  <>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">티어</label>
                      <TierPicker value={formTier} onChange={setFormTier} disabled={subBusy} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">계약 기간</label>
                      <ContractPeriodPicker
                        startDate={formStart}
                        endDate={formEnd}
                        onChange={({ start, end }) => {
                          setFormStart(start);
                          setFormEnd(end);
                        }}
                        placeholder="시작일 ~ 종료일"
                      />
                    </div>
                    <Button
                      onClick={submitNew}
                      disabled={subBusy || !formTier || !formStart || !formEnd}
                      fullWidth
                    >
                      {subBusy ? '등록 중...' : '구독 등록'}
                    </Button>
                  </>
                )}

                {subMode === 'correct' && (
                  <>
                    <p className="text-xs text-slate-500">
                      활성 구독의 잘못된 정보를 그대로 수정합니다 (history 안 남음).
                    </p>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">티어</label>
                      <TierPicker value={formTier} onChange={setFormTier} disabled={subBusy} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">계약 기간</label>
                      <ContractPeriodPicker
                        startDate={formStart}
                        endDate={formEnd}
                        onChange={({ start, end }) => {
                          setFormStart(start);
                          setFormEnd(end);
                        }}
                        placeholder="시작일 ~ 종료일"
                      />
                    </div>
                    <Button
                      onClick={submitCorrect}
                      disabled={subBusy || !formTier || !formStart || !formEnd}
                      fullWidth
                    >
                      {subBusy ? '저장 중...' : '정정 저장'}
                    </Button>
                  </>
                )}
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

function DateInput({
  value,
  onChange,
  disabled,
  label,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  disabled?: boolean;
  label: string;
}) {
  const isoDate = value ? format(value, 'yyyy-MM-dd') : '';
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <input
        type="date"
        value={isoDate}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? new Date(`${v}T00:00:00+09:00`) : undefined);
        }}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
      />
    </div>
  );
}

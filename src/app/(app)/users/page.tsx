'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspaces } from '@/hooks/workspace/useWorkspaceQuery';
import { AdminButton } from '@/components/ui/AdminButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  getUsers,
  createUser,
  updateUserRole,
  getCurrentRole,
  getWorkspaceMembers,
  assignWorkspace,
  removeWorkspace,
} from '@/lib/api/userApi';
import type { UserProfile, WorkspaceMember } from '@/lib/api/userApi';
import type { ProfileRole } from '@/types/auth';

const ROLE_LABEL: Record<ProfileRole, string> = {
  super_admin: '최고관리자',
  admin: '관리자',
  user: '사용자',
};

const ROLE_VARIANT: Record<ProfileRole, 'blue' | 'violet' | 'slate'> = {
  super_admin: 'blue',
  admin: 'violet',
  user: 'slate',
};

function useUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: getUsers });
}

function useMembers() {
  return useQuery({ queryKey: ['admin', 'workspace_members'], queryFn: getWorkspaceMembers });
}

function useMyRole() {
  return useQuery({ queryKey: ['admin', 'currentRole'], queryFn: getCurrentRole });
}

// ── 계정 생성 모달 ──

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (!email || !password || !companyName) return;
    setCreating(true);
    try {
      await createUser({ email, password, company_name: companyName });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('계정이 생성되었습니다.');
      onClose();
      setEmail('');
      setPassword('');
      setCompanyName('');
    } catch (e: any) {
      toast.error(e.message ?? '계정 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 계정 생성"
      size="md"
      footer={
        <AdminButton
          variant="primary"
          onClick={handleCreate}
          disabled={creating || !email || !password || !companyName}
        >
          {creating ? '생성 중...' : '계정 생성'}
        </AdminButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="name@company.com"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="8자 이상"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            회사명 <span className="text-red-500">*</span>
          </label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="(주)이노다이브"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
          />
        </div>
      </div>
    </Modal>
  );
}

// ── 유저 상세 모달 ──

function UserDetailModal({
  user,
  myRole,
  workspaces,
  members,
  open,
  onClose,
}: {
  user: UserProfile | null;
  myRole: ProfileRole;
  workspaces: { id: string; company_name: string; ticker: string }[];
  members: WorkspaceMember[];
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [pendingRole, setPendingRole] = useState<ProfileRole>('user');
  const [pendingWs, setPendingWs] = useState<string[]>([]);

  // 유저 변경 시 로컬 상태 초기화
  useEffect(() => {
    if (user) {
      setPendingRole(user.role);
      setPendingWs(members.filter((m) => m.profile_id === user.id).map((m) => m.workspace_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const isSuperAdmin = myRole === 'super_admin';
  const canEditWorkspace = isSuperAdmin || (myRole === 'admin' && user.role === 'user');
  const canEditRole = isSuperAdmin;
  const singleSelect = pendingRole === 'user';

  const currentWs = members.filter((m) => m.profile_id === user.id).map((m) => m.workspace_id);
  const hasChanges =
    pendingRole !== user.role ||
    JSON.stringify([...pendingWs].sort()) !== JSON.stringify([...currentWs].sort());

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
        prev.includes(wsId) ? prev.filter((id) => id !== wsId) : [...prev, wsId]
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (pendingRole !== user.role && canEditRole) {
        await updateUserRole(user.id, pendingRole);
      }
      if (canEditWorkspace) {
        const toRemove = currentWs.filter((id) => !pendingWs.includes(id));
        const toAdd = pendingWs.filter((id) => !currentWs.includes(id));
        for (const wsId of toRemove) await removeWorkspace(wsId, user.id);
        for (const wsId of toAdd) await assignWorkspace(wsId, user.id);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspace_members'] });
      toast.success('변경사항이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
      onClose();
    }
  };

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

        {canEditRole && (
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
        )}

        {!canEditRole && (
          <div>
            <span className="text-xs text-slate-400">권한</span>
            <p className="text-sm font-semibold text-slate-700">{ROLE_LABEL[user.role]}</p>
          </div>
        )}

        <div>
          <span className="text-xs font-semibold text-slate-600 mb-2 block">
            워크스페이스 배정{singleSelect && <span className="text-slate-400 font-normal ml-1">(1개만 선택)</span>}
          </span>
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {workspaces.map((ws) => {
              const assigned = pendingWs.includes(ws.id);
              return (
                <label
                  key={ws.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${canEditWorkspace ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-60'}`}
                >
                  <input
                    type={singleSelect ? 'radio' : 'checkbox'}
                    name={singleSelect ? 'workspace' : undefined}
                    checked={assigned}
                    onChange={() => handleWorkspaceToggle(ws.id)}
                    disabled={saving || !canEditWorkspace}
                    className="accent-slate-700"
                  />
                  <span className="text-sm text-slate-700">{ws.company_name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{ws.ticker}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── 메인 페이지 ──

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { data: myRole = 'user' } = useMyRole();
  const { data: workspaces = [] } = useWorkspaces();
  const { data: members = [] } = useMembers();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedUser = useMemo(
    () => users?.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.company_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="p-6 lg:p-8 h-full bg-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">유저 관리</h1>
          <AdminButton variant="primary" onClick={() => setShowCreate(true)}>
            계정 생성
          </AdminButton>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="회사명, 이메일로 검색"
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
        />

        {isLoading && <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">등록된 유저가 없습니다.</p>
        )}

        {filtered.length > 0 && (
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr] border-b border-slate-100 py-3 px-4 text-xs font-semibold text-slate-500">
              <div>회사명</div>
              <div>이메일</div>
              <div className="text-center">권한</div>
              <div className="text-center">가입일</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1.5fr_2fr_1fr_1fr] items-center py-3 px-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <div className="text-sm font-semibold text-slate-700">{user.company_name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                  <div className="text-center">
                    <Badge variant={ROLE_VARIANT[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                  </div>
                  <div className="text-xs text-slate-400 text-center">
                    {user.created_at.slice(0, 10)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} />
      <UserDetailModal
        user={selectedUser}
        myRole={myRole}
        workspaces={workspaces}
        members={members}
        open={!!selectedUser}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}

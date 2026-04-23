'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspaces } from '@/hooks/workspace/useWorkspaceQuery';
import {
  useUsersWithDetails,
  useMembers,
  useMyRole,
} from '@/hooks/user/useUserQuery';
import { AdminButton } from '@/components/ui/AdminButton';
import { CreateUserModal } from '@/components/user/CreateUserModal';
import { UserDetailModal } from '@/components/user/UserDetailModal';
import { CustomerTable } from '@/components/user/CustomerTable';
import { StaffTable } from '@/components/user/StaffTable';

type TabKey = 'customers' | 'staff';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab: TabKey =
    searchParams?.get('tab') === 'staff' ? 'staff' : 'customers';

  const setTab = (t: TabKey) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', t);
    router.replace(`/users?${params.toString()}`);
  };

  const { data: users = [], isLoading } = useUsersWithDetails();
  const { data: myRole = 'user' } = useMyRole();
  const { data: workspaces = [] } = useWorkspaces();
  const { data: members = [] } = useMembers();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const isSuperAdmin = myRole === 'super_admin';

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const filtered = useMemo(() => {
    const byTab = users.filter((u) =>
      currentTab === 'customers' ? u.role === 'user' : u.role !== 'user',
    );
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(
      (u) =>
        u.company_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, currentTab, search]);

  return (
    <div className="p-6 lg:p-8 h-full bg-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">유저 관리</h1>
          {isSuperAdmin && (
            <AdminButton variant="primary" onClick={() => setShowCreate(true)}>
              계정 생성
            </AdminButton>
          )}
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          <TabButton active={currentTab === 'customers'} onClick={() => setTab('customers')}>
            사용자
          </TabButton>
          <TabButton active={currentTab === 'staff'} onClick={() => setTab('staff')}>
            관리자
          </TabButton>
        </div>

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <input
            name="sir_user_search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="회사명, 이메일로 검색"
            autoComplete="off"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
          />
        </form>

        {isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>
        ) : currentTab === 'customers' ? (
          <CustomerTable users={filtered} onSelect={setSelectedUserId} />
        ) : (
          <StaffTable
            users={filtered}
            onSelect={isSuperAdmin ? setSelectedUserId : undefined}
          />
        )}
      </div>

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        myRole={myRole}
      />
      <UserDetailModal
        user={selectedUser}
        myRole={myRole}
        workspaces={workspaces}
        members={members}
        initialSubscription={selectedUser?.subscription}
        open={!!selectedUser}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
        active
          ? 'border-slate-700 text-slate-800'
          : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

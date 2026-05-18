import { useQuery } from '@tanstack/react-query';
import {
  getUsers,
  getUsersWithDetails,
  getCurrentRole,
  getWorkspaceMembers,
  getWorkspaceTokens,
} from '@/lib/api/userApi';

export const userKeys = {
  all: ['admin'] as const,
  users: () => ['admin', 'users'] as const,
  usersDetailed: () => ['admin', 'users', 'detailed'] as const,
  members: () => ['admin', 'workspace_members'] as const,
  currentRole: () => ['admin', 'currentRole'] as const,
  workspaceTokens: () => ['admin', 'workspace_tokens'] as const,
};

export function useUsers() {
  return useQuery({ queryKey: userKeys.users(), queryFn: getUsers });
}

export function useUsersWithDetails() {
  return useQuery({
    queryKey: userKeys.usersDetailed(),
    queryFn: getUsersWithDetails,
  });
}

export function useMembers() {
  return useQuery({ queryKey: userKeys.members(), queryFn: getWorkspaceMembers });
}

export function useMyRole() {
  return useQuery({ queryKey: userKeys.currentRole(), queryFn: getCurrentRole });
}

export function useWorkspaceTokens() {
  return useQuery({ queryKey: userKeys.workspaceTokens(), queryFn: getWorkspaceTokens });
}

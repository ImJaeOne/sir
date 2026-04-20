import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  updateUserRole,
  assignWorkspace,
  removeWorkspace,
} from '@/lib/api/userApi';
import { userKeys } from '@/hooks/user/useUserQuery';
import { workspaceKeys } from '@/hooks/workspace/useWorkspaceQuery';
import type { ProfileRole } from '@/types/auth';
import type { Tier } from '@/types/subscription';

export interface CreateUserInput {
  email: string;
  password: string;
  role: ProfileRole;
  company_name: string;
  ticker?: string;
  industry?: string;
  business_summary?: string;
  tier?: Tier;
  /** ISO 날짜 문자열, role='user' 일 때 필수 */
  subscription_start?: string;
  /** ISO 날짜 문자열, role='user' 일 때 필수 */
  subscription_end?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.users() });
      queryClient.invalidateQueries({ queryKey: userKeys.usersDetailed() });
      queryClient.invalidateQueries({ queryKey: userKeys.members() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export interface UpdateUserInput {
  userId: string;
  /** 권한 변경 없으면 undefined */
  roleChange?: ProfileRole;
  /** 추가 배정할 워크스페이스 id 목록 */
  wsAdd: string[];
  /** 배정 해제할 워크스페이스 id 목록 */
  wsRemove: string[];
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      if (input.roleChange) {
        await updateUserRole(input.userId, input.roleChange);
      }
      for (const wsId of input.wsRemove) {
        await removeWorkspace(wsId, input.userId);
      }
      for (const wsId of input.wsAdd) {
        await assignWorkspace(wsId, input.userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.users() });
      queryClient.invalidateQueries({ queryKey: userKeys.usersDetailed() });
      queryClient.invalidateQueries({ queryKey: userKeys.members() });
    },
  });
}

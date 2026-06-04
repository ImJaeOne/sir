'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useResetUserPassword } from '@/hooks/user/useUserMutation';
import { getErrorMessage } from '@/lib/utils';
import {
  checkPassword,
  PASSWORD_PLACEHOLDER,
  STRENGTH_LABEL,
  type PasswordStrength,
} from '@/lib/auth/passwordPolicy';

const STRENGTH_BAR_STYLE: Record<
  PasswordStrength,
  { fill: string; bars: number; text: string }
> = {
  weak: { fill: 'bg-red-400', bars: 1, text: 'text-red-500' },
  medium: { fill: 'bg-amber-400', bars: 2, text: 'text-amber-600' },
  strong: { fill: 'bg-green-500', bars: 3, text: 'text-green-600' },
};

interface PasswordResetSectionProps {
  userId: string;
  userEmail: string;
}

/**
 * super_admin 전용 — 대상 유저의 비밀번호를 원래 비번 없이 강제 재설정.
 * 부모(UserDetailModal)에서 isSuperAdmin 일 때만 렌더한다.
 */
export function PasswordResetSection({
  userId,
  userEmail,
}: PasswordResetSectionProps) {
  const [password, setPassword] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resetPassword = useResetUserPassword();

  const pwCheck = checkPassword(password);
  const strengthStyle = STRENGTH_BAR_STYLE[pwCheck.strength];

  const handleReset = async () => {
    try {
      await resetPassword.mutateAsync({ userId, password });
      toast.success('비밀번호가 재설정되었습니다.');
      setPassword('');
      setConfirmOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e, '비밀번호 재설정에 실패했습니다.'));
    }
  };

  return (
    <div className="pt-3 mt-1 border-t border-slate-100 flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-600">비밀번호 재설정</span>
      <p className="text-[11px] text-slate-400">
        기존 비밀번호를 몰라도 새 비밀번호로 즉시 변경됩니다. 고객사에 계정을
        배포하기 전 임시 비밀번호를 설정할 때 사용하세요.
      </p>

      <input
        name="sir_reset_password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder={PASSWORD_PLACEHOLDER}
        autoComplete="new-password"
        disabled={resetPassword.isPending}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400"
      />

      {password.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strengthStyle.bars ? strengthStyle.fill : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-medium ${strengthStyle.text}`}>
              {STRENGTH_LABEL[pwCheck.strength]}
            </span>
          </div>
          <ul className="space-y-1">
            {pwCheck.rules.map((rule) => (
              <li key={rule.key} className="flex items-center gap-1.5 text-xs">
                {rule.passed ? (
                  <Check size={12} className="text-green-500 shrink-0" />
                ) : (
                  <X size={12} className="text-slate-300 shrink-0" />
                )}
                <span className={rule.passed ? 'text-green-600' : 'text-slate-400'}>
                  {rule.label}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={resetPassword.isPending || !pwCheck.ok}
        fullWidth
      >
        {resetPassword.isPending ? '변경 중...' : '비밀번호 재설정'}
      </Button>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReset}
        title="비밀번호 재설정"
        message={
          <>
            <span className="font-semibold">{userEmail}</span> 계정의 비밀번호를 새
            비밀번호로 변경합니다. 되돌릴 수 없습니다.
          </>
        }
        confirmLabel="재설정"
        confirmVariant="danger"
        loading={resetPassword.isPending}
      />
    </div>
  );
}

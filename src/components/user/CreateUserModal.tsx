'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';
import { AdminButton } from '@/components/ui/AdminButton';
import { Modal } from '@/components/ui/Modal';
import { CompanySearch } from '@/components/ui/CompanySearch';
import { DatePicker } from '@/components/ui/DatePicker';
import { useCreateUser } from '@/hooks/user/useUserMutation';
import {
  TIER_LABELS,
  TIER_OPTIONS,
  DURATION_OPTIONS,
  type Tier,
  type SubscriptionDuration,
} from '@/types/subscription';
import type { ProfileRole } from '@/types/auth';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  myRole: ProfileRole;
}

export function CreateUserModal({ open, onClose, myRole }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<ProfileRole>('user');

  // role='user' 전용
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; ticker: string } | null>(
    null
  );
  const [industry, setIndustry] = useState('');
  const [businessSummary, setBusinessSummary] = useState('');
  const [tier, setTier] = useState<Tier>('black_plus');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState<SubscriptionDuration>(1);

  // admin/super_admin 전용
  const [companyNameAdmin, setCompanyNameAdmin] = useState('');

  const createUserMutation = useCreateUser();
  const isSuperAdmin = myRole === 'super_admin';
  const endDate = startDate ? addMonths(startDate, duration) : null;

  const canSubmit =
    email.length > 0 &&
    password.length > 0 &&
    (role === 'user'
      ? selectedCompany !== null && startDate !== undefined
      : companyNameAdmin.trim().length > 0);

  const reset = () => {
    setEmail('');
    setPassword('');
    setRole('user');
    setSelectedCompany(null);
    setIndustry('');
    setBusinessSummary('');
    setTier('black_plus');
    setStartDate(new Date());
    setDuration(1);
    setCompanyNameAdmin('');
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      const payload =
        role === 'user' && selectedCompany && startDate && endDate
          ? {
              email,
              password,
              role: 'user' as ProfileRole,
              company_name: selectedCompany.name,
              ticker: selectedCompany.ticker,
              industry: industry.trim() || undefined,
              business_summary: businessSummary.trim() || undefined,
              tier,
              subscription_start: startDate.toISOString(),
              subscription_end: endDate.toISOString(),
            }
          : {
              email,
              password,
              role,
              company_name: companyNameAdmin.trim(),
            };
      await createUserMutation.mutateAsync(payload);
      toast.success('계정이 생성되었습니다.');
      reset();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? '계정 생성에 실패했습니다.');
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
          disabled={createUserMutation.isPending || !canSubmit}
          fullWidth
        >
          {createUserMutation.isPending ? '생성 중...' : '계정 생성'}
        </AdminButton>
      }
    >
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-600 mb-1 block">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            name="sir_new_account_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="name@company.com"
            autoComplete="off"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600 mb-1 block">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            name="sir_new_account_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="8자 이상"
            autoComplete="new-password"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400"
          />
        </div>

        {isSuperAdmin && (
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block">권한</label>
            <div className="flex gap-2">
              {(['user', 'admin', 'super_admin'] as ProfileRole[]).map((r) => (
                <AdminButton
                  key={r}
                  variant={role === r ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setRole(r)}
                >
                  {r === 'user' ? '사용자' : r === 'admin' ? '관리자' : '최고관리자'}
                </AdminButton>
              ))}
            </div>
          </div>
        )}

        {role === 'user' ? (
          <>
            <CompanySearch onChange={setSelectedCompany} />

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">
                서비스 티어 <span className="text-red-500">*</span>
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as Tier)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400 bg-white"
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">
                계약 시작일 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="계약 시작일 선택"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">
                계약 기간 <span className="text-red-500">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as SubscriptionDuration)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400 bg-white"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {endDate && (
              <div className="text-xs text-slate-500">
                예상 종료일:{' '}
                <span className="text-slate-700 font-medium">{format(endDate, 'yyyy-MM-dd')}</span>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">업종</label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="예: 게임, 반도체, 바이오"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">사업 개요</label>
              <textarea
                value={businessSummary}
                onChange={(e) => setBusinessSummary(e.target.value)}
                rows={3}
                placeholder="주요 사업 내용, 매출 구조, 자회사 등"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400 resize-none"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1 block">
              회사명 <span className="text-red-500">*</span>
            </label>
            <input
              name="sir_new_account_company_name"
              value={companyNameAdmin}
              onChange={(e) => setCompanyNameAdmin(e.target.value)}
              placeholder="(주)이노다이브"
              autoComplete="off"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-slate-400"
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, X } from 'lucide-react';
import { signup } from '@/app/auth/actions';

const DEPARTMENTS = ['개발', '디자인', '기획'] as const;

const PASSWORD_RULES = [
  { key: 'length', label: '8자 이상', test: (v: string) => v.length >= 8 },
  { key: 'uppercase', label: '영문 대문자 포함', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'lowercase', label: '영문 소문자 포함', test: (v: string) => /[a-z]/.test(v) },
  { key: 'number', label: '숫자 포함', test: (v: string) => /[0-9]/.test(v) },
  { key: 'special', label: '특수문자 포함 (!@#$%^&*)', test: (v: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v) },
] as const;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [department, setDepartment] = useState('');
  const [deptOpen, setDeptOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ruleResults = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
  const allPassed = ruleResults.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!allPassed) {
      setError('비밀번호 조건을 모두 충족해주세요.');
      return;
    }
    if (!passwordsMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (!result.success) {
      setError(result.error ?? '회원가입에 실패했습니다.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl mb-3">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">InnoPlan SIR</h1>
          <p className="text-sm text-slate-400 mt-1">새 계정 만들기</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
              이름
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              부서
            </label>
            <input type="hidden" name="department" value={department} />
            <div ref={deptRef} className="relative">
              <button
                type="button"
                onClick={() => setDeptOpen((v) => !v)}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between transition-colors cursor-pointer ${
                  deptOpen
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={department ? 'text-slate-800' : 'text-slate-400'}>
                  {department || '부서를 선택해주세요'}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${deptOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {deptOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                  {DEPARTMENTS.map((dept) => (
                    <li key={dept}>
                      <button
                        type="button"
                        onClick={() => { setDepartment(dept); setDeptOpen(false); }}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between cursor-pointer transition-colors ${
                          department === dept
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {dept}
                        {department === dept && <Check size={14} className="text-blue-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordTouched(true)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호 입력"
            />
            {/* 비밀번호 규칙 체크리스트 */}
            {passwordTouched && (
              <ul className="mt-2 space-y-1">
                {ruleResults.map((rule) => (
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
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                confirmPassword && !passwordsMatch
                  ? 'border-red-300 bg-red-50/30'
                  : confirmPassword && passwordsMatch
                    ? 'border-green-300'
                    : 'border-slate-200'
              }`}
              placeholder="비밀번호 재입력"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allPassed || !passwordsMatch || !confirmPassword || !department}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

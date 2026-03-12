'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MOCK_ANALYSIS_RESULTS } from '@/constants/analysisResults';
import { MOCK_CRAWL_RESULTS } from '@/constants/crawlResults';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

const DEFAULT_RECIPIENTS = [
  { email: 'dlawi0108@gnu.ac.kr', name: 'IR팀', checked: true },
];

export function EmailResult() {
  const searchParams = useSearchParams();
  const company = searchParams?.get('company') ?? 'Company';
  const startDate = searchParams?.get('startDate') ?? '';
  const endDate = searchParams?.get('endDate') ?? '';

  const totalArticles = MOCK_CRAWL_RESULTS.reduce((sum, p) => sum + p.articles.length, 0);
  const totalScore = Math.round(
    MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.sirScore, 0) / MOCK_ANALYSIS_RESULTS.length
  );
  const totalFlagged = MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.flagged.length, 0);

  const [recipients, setRecipients] = useState(DEFAULT_RECIPIENTS);
  const [newEmail, setNewEmail] = useState('');
  const [subject, setSubject] = useState(
    `[SIR Report] ${company} 감성 분석 리포트 (${startDate} ~ ${endDate})`
  );
  const [attachPdf, setAttachPdf] = useState(true);
  const [attachDocx, setAttachDocx] = useState(true);
  const [status, setStatus] = useState<SendStatus>('idle');

  const handleAddRecipient = () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    if (recipients.some((r) => r.email === trimmed)) return;
    setRecipients((prev) => [...prev, { email: trimmed, name: '', checked: true }]);
    setNewEmail('');
  };

  const handleToggleRecipient = (email: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.email === email ? { ...r, checked: !r.checked } : r))
    );
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
  };

  const checkedRecipients = recipients.filter((r) => r.checked);

  const handleSend = async () => {
    if (checkedRecipients.length === 0) return;
    setStatus('sending');

    try {
      // TODO: 실제 이메일 발송 API 호출
      // const res = await fetch('/api/email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     recipients: checkedRecipients.map((r) => r.email),
      //     subject,
      //     attachPdf,
      //     attachDocx,
      //     company,
      //     dateRange: `${startDate} ~ ${endDate}`,
      //   }),
      // });
      // if (!res.ok) throw new Error('Failed to send');

      // Mock: 1.5초 후 성공
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 수신자 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">수신자</span>
        <div className="flex flex-col gap-1.5">
          {recipients.map((r) => (
            <div
              key={r.email}
              className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2"
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={r.checked}
                  onChange={() => handleToggleRecipient(r.email)}
                  className="accent-blue-600 shrink-0"
                />
                <span className="text-sm text-slate-700 truncate">{r.email}</span>
                {r.name && (
                  <span className="text-xs text-slate-400 shrink-0">({r.name})</span>
                )}
              </label>
              <button
                onClick={() => handleRemoveRecipient(r.email)}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
            placeholder="수신자 이메일 추가"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <button
            onClick={handleAddRecipient}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            추가
          </button>
        </div>
      </div>

      {/* 제목 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">제목</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>

      {/* 본문 미리보기 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">본문 미리보기</span>
        <div className="border border-slate-100 rounded-xl bg-white px-4 py-4 text-sm text-slate-700 flex flex-col gap-3">
          <p>안녕하세요,</p>
          <p>
            <span className="font-semibold">{company}</span>의 SIR 감성 분석 리포트를 전달드립니다.
          </p>
          <div className="bg-slate-50 rounded-lg px-4 py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">분석 기간</span>
              <span className="text-xs font-medium text-slate-700">{startDate} ~ {endDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">수집 자료</span>
              <span className="text-xs font-medium text-blue-600">{totalArticles}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">종합 SIR 지수</span>
              <span className={`text-xs font-bold ${totalScore >= 70 ? 'text-green-600' : totalScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {totalScore}점
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">주의 컨텐츠</span>
              <span className="text-xs font-medium text-red-600">{totalFlagged}건</span>
            </div>
          </div>
          <p>상세 내용은 첨부된 리포트를 참고해주세요.</p>
          <p className="text-slate-400">감사합니다.</p>
        </div>
      </div>

      {/* 첨부파일 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">첨부파일</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={attachPdf}
              onChange={() => setAttachPdf((v) => !v)}
              className="accent-red-600"
            />
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-red-500">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 5h4M5 7h4M5 9h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-medium text-red-700">PDF</span>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={attachDocx}
              onChange={() => setAttachDocx((v) => !v)}
              className="accent-blue-600"
            />
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-blue-500">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 5h4M5 7h4M5 9h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-medium text-blue-700">DOCX</span>
            </div>
          </label>
        </div>
      </div>

      {/* Send button */}
      {status === 'sent' ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-500 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-700">발송 완료</span>
            <span className="text-xs text-green-600">
              {checkedRecipients.map((r) => r.email).join(', ')}
            </span>
          </div>
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-red-700">발송 실패 — 다시 시도해주세요</span>
          </div>
          <button
            onClick={handleSend}
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            다시 발송
          </button>
        </div>
      ) : (
        <button
          onClick={handleSend}
          disabled={status === 'sending' || checkedRecipients.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="47 16" strokeLinecap="round" />
              </svg>
              발송 중...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M14 2L7 9M14 2l-4.5 12-2-5.5L2 6l12-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              {checkedRecipients.length}명에게 리포트 발송
            </>
          )}
        </button>
      )}
    </div>
  );
}

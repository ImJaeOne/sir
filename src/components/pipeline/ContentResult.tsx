'use client';

import { useState } from 'react';
import { MOCK_CONTENT_STRATEGIES } from '@/constants/contentStrategies';
import { ChevronIcon } from '@/components/ui/ChevronIcon';
import { useToggleSet } from '@/hooks/useToggleSet';

function ReportModal({
  title,
  platform,
  reason,
  onClose,
}: {
  title: string;
  platform: string;
  reason: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">신고 서식 작성</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">신고 채널</label>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{platform}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">신고 대상</label>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{title}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">신고 사유</label>
            <textarea
              defaultValue={reason}
              rows={3}
              className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">신고 유형</label>
            <select className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
              <option>허위 정보 유포</option>
              <option>명예훼손</option>
              <option>저작권 침해</option>
              <option>개인정보 침해</option>
              <option>기타</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
          >
            신고 접수
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContentResult({ selectedUrls }: { selectedUrls: Set<string> }) {
  const strategies = useToggleSet();
  const [reportTarget, setReportTarget] = useState<{
    title: string;
    platform: string;
    reason: string;
  } | null>(null);

  // 선택된 URL에 해당하는 전략만 필터
  const items = MOCK_CONTENT_STRATEGIES.filter((s) => selectedUrls.has(s.url));
  const responseItems = items.filter((s) => !s.reportable);
  const reportableItems = items.filter((s) => s.reportable);

  return (
    <div className="flex flex-col gap-4">
      {/* 대응 전략 (신고 불가능) */}
      {responseItems.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              대응 전략
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {responseItems.map((item) => {
              const isOpen = strategies.has(item.url);
              return (
                <div key={item.url} className="border-t border-slate-50">
                  <button
                    onClick={() => strategies.toggle(item.url)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {item.category}
                      </span>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                        {item.platform}
                      </span>
                      <span className="text-sm text-slate-700 truncate">{item.title}</span>
                    </div>
                    <ChevronIcon open={isOpen} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3 pt-1">
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                        <div className="flex items-start gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500 shrink-0 mt-0.5">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
                          </svg>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-amber-700">대응 전략</span>
                            <p className="text-sm text-slate-700 leading-relaxed">{item.strategy}</p>
                          </div>
                        </div>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate transition-colors mt-2 block"
                      >
                        {item.url}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 신고 가능 목록 */}
      {reportableItems.length > 0 && (
        <div className="border border-red-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-500 shrink-0">
              <path d="M3 2.5h10v11l-5-3-5 3v-11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              신고 가능 컨텐츠
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {reportableItems.map((item) => (
              <div
                key={item.url}
                className="border-t border-red-50 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                      {item.platform}
                    </span>
                  </div>
                  <span className="text-sm text-slate-700 truncate">{item.title}</span>
                  <span className="text-xs text-red-500">{item.reportReason}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate transition-colors"
                  >
                    {item.url}
                  </a>
                </div>
                <button
                  onClick={() =>
                    setReportTarget({
                      title: item.title,
                      platform: item.platform,
                      reason: item.reportReason ?? '',
                    })
                  }
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                >
                  신고하기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          title={reportTarget.title}
          platform={reportTarget.platform}
          reason={reportTarget.reason}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

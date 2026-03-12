'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PipelineStage, StageStatus } from '@/types/pipeline';

interface StagePanelProps {
  stage: PipelineStage;
  index: number;
  status: StageStatus;
  locked: boolean;
  onStart: () => void;
  onSkip?: () => void;
  badge?: ReactNode;
  children?: ReactNode;
}

export function StagePanel({ stage, index, status, locked, onStart, onSkip, badge, children }: StagePanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm transition-all duration-300 ${
        locked
          ? 'border-slate-100 opacity-40 pointer-events-none'
          : status === 'completed'
            ? 'border-green-100'
            : status === 'skipped'
              ? 'border-slate-200 opacity-60'
              : 'border-blue-200 shadow-md'
      }`}
    >
      {/* Stage header */}
      <div
        className={`flex items-center justify-between gap-3 p-5 sm:p-6 lg:p-8 ${
          status === 'completed' ? 'cursor-pointer' : ''
        }`}
        onClick={status === 'completed' ? () => setExpanded((v) => !v) : undefined}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              status === 'completed'
                ? 'bg-green-100 text-green-600'
                : status === 'skipped'
                  ? 'bg-slate-100 text-slate-400'
                  : locked
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-blue-100 text-blue-600'
            }`}
          >
            {status === 'completed' ? '✓' : status === 'skipped' ? '—' : index + 1}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">{stage.label}</h2>
          {badge}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === 'completed' && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              완료
            </span>
          )}
          {status === 'skipped' && (
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              건너뜀
            </span>
          )}

          {/* Idle: start button + optional skip */}
          {status === 'idle' && !locked && (
            <div className="flex items-center gap-2">
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="border border-slate-200 text-slate-500 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  건너뛰기
                </button>
              )}
              <button
                onClick={onStart}
                className="bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {stage.buttonText}
              </button>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="47 16"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm font-medium text-blue-600">처리 중...</span>
            </div>
          )}

          {/* Locked */}
          {locked && (
            <span className="text-xs text-slate-400">이전 단계를 완료하면 시작할 수 있습니다</span>
          )}

          {/* Completed: toggle chevron */}
          {status === 'completed' && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          )}
        </div>
      </div>

      {/* Completed: results (toggleable) */}
      {status === 'completed' && expanded && (
        <div className="px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8">
          {children || (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-700">{stage.result.summary}</p>
              <ul className="flex flex-col gap-2">
                {stage.result.items.map((item) => (
                  <li key={item} className="text-sm text-slate-500 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useMonitoringAiAnalysisEstimate } from '@/hooks/monitoring/useMonitoringQuery';

interface Props {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
  /** "분석하기" 클릭 시 부모에게 확정 기간 전달. 부모가 모달 닫고 분석 mutation 실행. */
  onSubmit: (start: string, end: string) => void;
}

const PRESETS = [
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: 90, label: '90일' },
] as const;

/** KST 오늘 (분석 기준 end = 어제) */
function kstYesterdayStr(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - 1);
  return kst.toISOString().slice(0, 10);
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 두 ISO 일자(KST) 차이 (end - start + 1, inclusive). 음수면 0. */
function daysBetween(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00+09:00`).getTime();
  const e = new Date(`${end}T00:00:00+09:00`).getTime();
  return Math.max(0, Math.floor((e - s) / 86400000) + 1);
}

export function AiAnalysisModal({ open, workspaceId, onClose, onSubmit }: Props) {
  const yesterday = kstYesterdayStr();
  const [presetDays, setPresetDays] = useState<7 | 30 | 90 | null>(30);
  const [customStart, setCustomStart] = useState<string>(shiftDays(yesterday, -29));
  const [customEnd, setCustomEnd] = useState<string>(yesterday);

  // 모달 열릴 때 디폴트 = 30일 프리셋 (가장 자주 쓰는 케이스)
  useEffect(() => {
    if (open) {
      setPresetDays(30);
      setCustomStart(shiftDays(yesterday, -29));
      setCustomEnd(yesterday);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 실제 분석할 기간 — 프리셋 선택 시 = end 어제 / start = end - (N-1). 커스텀 모드면 입력값 사용.
  const start = presetDays === null ? customStart : shiftDays(yesterday, -(presetDays - 1));
  const end = presetDays === null ? customEnd : yesterday;
  const totalDays = daysBetween(start, end);
  const exceedsMax = totalDays > 90;
  const invalidRange = !start || !end || totalDays === 0 || end < start;

  const estimateQ = useMonitoringAiAnalysisEstimate(
    open && !invalidRange && !exceedsMax ? workspaceId : '',
    start,
    end,
  );
  const est = estimateQ.data;

  const insufficient =
    !!est && !est.unlimited && est.estimated_total_tokens > est.token_balance;

  const canSubmit = !invalidRange && !exceedsMax && !!est && !insufficient && !estimateQ.isFetching;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(start, end);
  };

  return (
    <Modal open={open} onClose={onClose} title="AI 분석 기간 선택" size="md">
      <div className="flex flex-col gap-4">
        {/* 프리셋 ────────────────────────────── */}
        <div>
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-slate-400 mb-2 block">
            기간 선택
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((p) => {
              const on = presetDays === p.days;
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setPresetDays(p.days)}
                  className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    on
                      ? 'bg-bg-accent text-white border-bg-accent'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPresetDays(null)}
              className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                presetDays === null
                  ? 'bg-bg-accent text-white border-bg-accent'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              직접 선택
            </button>
          </div>
        </div>

        {/* 직접 선택 모드일 때 날짜 input ───────── */}
        {presetDays === null && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">시작일 (KST)</label>
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-slate-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">종료일 (KST)</label>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={yesterday}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-slate-400 tabular-nums"
              />
            </div>
          </div>
        )}

        {/* 기간 요약 ─────────────────────────── */}
        <div className="text-[12px] text-slate-500 tabular-nums">
          분석 기간 · <span className="font-semibold text-slate-700">{start.slice(2).replace(/-/g, '.')} ~ {end.slice(2).replace(/-/g, '.')}</span> ({totalDays}일)
        </div>

        {/* 토큰/잔액 ─────────────────────────── */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          {exceedsMax ? (
            <div className="flex items-center gap-2 text-rose-600 text-xs">
              <AlertCircle size={14} />
              <span>최대 90일까지만 분석할 수 있습니다.</span>
            </div>
          ) : invalidRange ? (
            <div className="text-xs text-slate-400">기간을 선택하세요.</div>
          ) : estimateQ.isError ? (
            <div className="flex items-start gap-2 text-rose-600 text-xs">
              <AlertCircle size={14} className="mt-0.5" />
              <span>{(estimateQ.error as Error).message}</span>
            </div>
          ) : !est || estimateQ.isFetching ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
              <span>예상 토큰 계산 중...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 text-[12px]">
              <TokenRow label="예상 입력 토큰" value={est.estimated_input_tokens.toLocaleString()} />
              <TokenRow label="예상 출력 토큰" value={`~${est.estimated_output_tokens.toLocaleString()}`} />
              <div className="border-t border-slate-200 mt-1 pt-1.5">
                <TokenRow
                  label="합계 (예상)"
                  value={est.estimated_total_tokens.toLocaleString()}
                  bold
                />
              </div>
              <div className="border-t border-slate-200 mt-1.5 pt-1.5">
                {est.unlimited ? (
                  <TokenRow label="분석 후 예상 잔여 토큰" value="무제한 (테스트 계정)" muted />
                ) : (
                  <TokenRow
                    label="분석 후 예상 잔여 토큰"
                    value={(est.token_balance - est.estimated_total_tokens).toLocaleString()}
                    danger={insufficient}
                  />
                )}
              </div>
              {insufficient && (
                <div className="flex items-start gap-2 text-rose-600 text-[11px] mt-1.5">
                  <AlertCircle size={12} className="mt-0.5" />
                  <span>잔여 토큰이 부족합니다. 관리자에게 충전을 요청하세요.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 액션 ────────────────────────────── */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
            분석
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TokenRow({
  label,
  value,
  bold,
  danger,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={`tabular-nums ${bold ? 'font-bold text-slate-900' : 'font-semibold'} ${
          danger ? 'text-rose-600' : muted ? 'text-slate-400' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

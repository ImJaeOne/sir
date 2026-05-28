'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, History, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { useMonitoringAiAnalysisHistory } from '@/hooks/monitoring/useMonitoringQuery';
import type { MonitoringAiAnalysisHistoryRow } from '@/lib/api/monitoringApi';

/** ISO timestamptz → "YY.MM.DD HH:mm" (KST) */
function formatKst(iso: string): string {
  try {
    const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
    const yy = String(kst.getUTCFullYear()).slice(2);
    const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mi = String(kst.getUTCMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

/** "YYYY-MM-DD" → "YY.MM.DD" */
function formatDate(d: string): string {
  return d ? d.slice(2).replace(/-/g, '.') : '';
}

function daysBetween(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00+09:00`).getTime();
  const e = new Date(`${end}T00:00:00+09:00`).getTime();
  return Math.max(0, Math.floor((e - s) / 86400000) + 1);
}

type RangeFilter = 'all' | '7d' | '30d';

const RANGE_OPTIONS: { id: RangeFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: '7d', label: '최근 7일' },
  { id: '30d', label: '최근 30일' },
];

export default function InsightsHistoryPage() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) ?? '';
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: rows = [], isPending } = useMonitoringAiAnalysisHistory(workspaceId);

  const [range, setRange] = useState<RangeFilter>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (range === 'all') return rows;
    const days = range === '7d' ? 7 : 30;
    // eslint-disable-next-line react-hooks/purity -- range 변경 시 cutoff 재계산. 매 렌더 정밀 동기화 불필요.
    const cutoff = Date.now() - days * 86400000;
    return rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
  }, [rows, range]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="mx-auto w-full max-w-[1240px] px-4 lg:px-10 py-7 lg:py-10 flex flex-col gap-6">
        {/* 헤더 ─────────────────────────────────── */}
        <div className="flex flex-col gap-3 bg-bg-dark px-5 py-5 lg:px-10 lg:py-8 rounded-xl">
          <div className="flex items-center gap-2.5">
            <History size={24} className="text-violet-400" />
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              {workspace?.company_name ?? '워크스페이스'} 분석 히스토리
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-text-muted">
            인사이트에서 실행한 AI 분석 기록을 시간순으로 모아 봅니다. 각 항목을 클릭하면 본문이 펼쳐집니다.
          </p>
        </div>

        {/* 필터 ─────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 px-4 lg:px-5 py-3.5 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-400">기간</span>
          <div className="flex items-center gap-1 flex-wrap">
            {RANGE_OPTIONS.map((opt) => {
              const active = range === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRange(opt.id)}
                  className={`text-[11.5px] font-bold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-slate-400 tabular-nums ml-auto">{filtered.length}건</span>
        </div>

        {/* 목록 ─────────────────────────────────── */}
        {isPending ? (
          <div className="text-center py-16 text-slate-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <EmptyState workspaceId={workspaceId} hasAny={rows.length > 0} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((row) => (
              <HistoryCard
                key={row.id}
                row={row}
                open={openIds.has(row.id)}
                onToggle={() => toggle(row.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({
  row,
  open,
  onToggle,
}: {
  row: MonitoringAiAnalysisHistoryRow;
  open: boolean;
  onToggle: () => void;
}) {
  const used = row.input_tokens + row.output_tokens;
  const days = daysBetween(row.period_start, row.period_end);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 lg:p-5 cursor-pointer hover:bg-slate-50/40 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-bold text-slate-800 tabular-nums">
              {formatKst(row.created_at)}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[12px] text-slate-600 tabular-nums">
              {formatDate(row.period_start)} ~ {formatDate(row.period_end)} ({days}일)
            </span>
            <span className="text-[11px] font-bold text-violet-700 bg-violet-100/70 px-1.5 py-0.5 rounded-md tabular-nums">
              {used.toLocaleString()} 토큰
            </span>
          </div>
        </div>
        <div className="shrink-0 text-slate-300">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 lg:px-5 lg:pb-5 pt-0">
          <div className="rounded-xl bg-violet-50/30 border border-violet-100 p-5 lg:p-6">
            <article
              className="
                text-[13px] leading-[1.7] text-slate-700 w-full
                [&>h2]:relative [&>h2]:mt-5 [&>h2]:mb-2.5 [&>h2]:pl-3 [&>h2]:text-[14px] [&>h2]:font-bold [&>h2]:text-slate-900
                [&>h2]:before:content-[''] [&>h2]:before:absolute [&>h2]:before:left-0 [&>h2]:before:top-1 [&>h2]:before:bottom-1 [&>h2]:before:w-[3px] [&>h2]:before:rounded-full [&>h2]:before:bg-violet-500
                [&>h2:first-child]:mt-0
                [&>p]:my-2.5
                [&>ul]:my-2.5 [&>ul]:pl-0 [&>ul]:list-none [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-2
                [&>ul>li]:relative [&>ul>li]:pl-4
                [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-1 [&>ul>li]:before:top-[0.65em] [&>ul>li]:before:w-1 [&>ul>li]:before:h-1 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-violet-400
                [&_strong]:font-bold [&_strong]:text-slate-900
                [&>hr]:my-4 [&>hr]:border-slate-100
              "
            >
              <ReactMarkdown>{row.content}</ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ workspaceId, hasAny }: { workspaceId: string; hasAny: boolean }) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="inline-flex w-10 h-10 rounded-full bg-violet-100/70 text-violet-600 items-center justify-center mb-3">
        <Sparkles size={18} />
      </div>
      {hasAny ? (
        <>
          <p className="text-[13px] text-slate-600 font-semibold mb-1">선택한 기간에 분석 기록이 없습니다.</p>
          <p className="text-[12px] text-slate-400">기간 필터를 조정하거나 전체를 선택해 보세요.</p>
        </>
      ) : (
        <>
          <p className="text-[13px] text-slate-600 font-semibold mb-1">아직 분석한 기록이 없습니다.</p>
          <p className="text-[12px] text-slate-400">
            <Link href={`/monitoring/${workspaceId}`} className="text-violet-600 font-bold hover:underline">
              인사이트
            </Link>{' '}
            에서 AI 분석을 시작해 보세요.
          </p>
        </>
      )}
    </div>
  );
}

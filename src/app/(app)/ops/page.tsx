'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import { getOpsQueue, type OpsActiveSession, type OpsCompletion, type OpsQueue } from '@/lib/api/opsApi';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plex',
});

const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jb-mono',
});

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: 'NEWS',
  naver_blog: 'BLOG',
  youtube: 'YTUBE',
  naver_stock: 'STOCK',
  dcinside: 'DCINS',
};

const LOCK_TYPE_LABELS: Record<string, string> = {
  pipeline: 'PIPELINE',
  retry: 'RETRY',
  regenerate: 'REGEN',
};

interface Accent {
  fg: string;
  glow: string;
  bar: string;
}

const ACCENTS: Record<string, Accent> = {
  pipeline: { fg: '#7aa2ff', glow: 'rgba(122, 162, 255, 0.35)', bar: '#7aa2ff' },
  retry: { fg: '#ffb86b', glow: 'rgba(255, 184, 107, 0.35)', bar: '#ffb86b' },
  regenerate: { fg: '#c084fc', glow: 'rgba(192, 132, 252, 0.35)', bar: '#c084fc' },
  crawling: { fg: '#38d9c8', glow: 'rgba(56, 217, 200, 0.4)', bar: '#38d9c8' },
  analyzing: { fg: '#ffb86b', glow: 'rgba(255, 184, 107, 0.4)', bar: '#ffb86b' },
  pending: { fg: '#6a6f7a', glow: 'rgba(106, 111, 122, 0.25)', bar: '#6a6f7a' },
  done: { fg: '#7ee0a4', glow: 'rgba(126, 224, 164, 0.25)', bar: '#7ee0a4' },
  failed: { fg: '#fb7185', glow: 'rgba(251, 113, 133, 0.3)', bar: '#fb7185' },
};

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// 시드 기반 의사난수 — SSR/CSR 불일치 방지
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NeuronNode { id: number; x: number; y: number; r: number; delay: number; dur: number; }
interface NeuronEdge { a: number; b: number; delay: number; }

const NEURAL_LAYOUT: { nodes: NeuronNode[]; edges: NeuronEdge[] } = (() => {
  const rand = mulberry32(0xC0FFEE);
  const N = 34;
  const nodes: NeuronNode[] = Array.from({ length: N }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    r: 0.18 + rand() * 0.5,
    delay: rand() * 5,
    dur: 3 + rand() * 4,
  }));
  // 근접 노드 쌍 엣지
  const edges: NeuronEdge[] = [];
  for (let i = 0; i < N; i++) {
    const distances = nodes.map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }));
    distances.sort((a, b) => a.d - b.d);
    const pickCount = 2 + Math.floor(rand() * 2);
    for (let k = 1; k <= pickCount; k++) {
      const j = distances[k].j;
      if (j > i && distances[k].d < 28) {
        edges.push({ a: i, b: j, delay: rand() * 6 });
      }
    }
  }
  return { nodes, edges };
})();

function NeuralBackground() {
  const { nodes, edges } = NEURAL_LAYOUT;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7aa2ff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#7aa2ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7aa2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map((e, i) => {
        const a = nodes[e.a], b = nodes[e.b];
        return (
          <line
            key={`e${i}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#7aa2ff"
            strokeWidth="0.06"
            strokeOpacity="0.13"
            style={{ animation: `opsEdgePulse ${5 + (i % 3)}s ease-in-out ${e.delay}s infinite` }}
          />
        );
      })}
      {nodes.map((n) => (
        <g key={`n${n.id}`} style={{ animation: `opsNodePulse ${n.dur}s ease-in-out ${n.delay}s infinite` }}>
          <circle cx={n.x} cy={n.y} r={n.r * 3} fill="url(#nodeGlow)" opacity="0.3" />
          <circle cx={n.x} cy={n.y} r={n.r} fill="#a8c0ff" opacity="0.75" />
        </g>
      ))}
    </svg>
  );
}

function elapsed(startedAt: string, now: Date): string {
  const start = new Date(startedAt).getTime();
  const sec = Math.max(0, Math.floor((now.getTime() - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function clockStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function trunc(s: string | null | undefined, n = 8): string {
  if (!s) return '—';
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function Synapse({ accent, size = 9 }: { accent: Accent; size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size + 6, height: size + 6 }}>
      <span
        className="absolute rounded-full"
        style={{
          width: size + 6,
          height: size + 6,
          background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
          animation: 'opsPulse 1.8s ease-in-out infinite',
        }}
      />
      <span
        className="relative rounded-full"
        style={{
          width: size - 3,
          height: size - 3,
          background: accent.fg,
          boxShadow: `0 0 8px ${accent.fg}`,
        }}
      />
    </span>
  );
}

function IdleDot() {
  return <span className="inline-block rounded-full bg-[#2a2e37]" style={{ width: 6, height: 6 }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] tracking-[0.2em] uppercase text-[#8b909b]"
      style={{ fontFamily: 'var(--font-jb-mono)' }}
    >
      {children}
    </span>
  );
}

function Meta({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 text-[12px]">
      <span
        className="w-14 text-[10px] tracking-[0.18em] uppercase text-[#8b909b]"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        {k}
      </span>
      <span
        className="flex-1 text-[#e4e7eb] tabular-nums truncate"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        {v}
      </span>
    </div>
  );
}

function SectionHead({
  code,
  title,
  count,
  accent,
}: {
  code: string;
  title: string;
  count: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="text-[10px] tracking-[0.25em] uppercase text-[#8b909b]"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        [{code}]
      </span>
      <h2
        className="text-[14px] tracking-[0.2em] uppercase text-[#e4e7eb]"
        style={{ fontFamily: 'var(--font-jb-mono)', fontWeight: 500 }}
      >
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-[#1e2127] to-transparent" />
      <span
        className="text-[11px] tabular-nums text-[#8b909b]"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        {String(count).padStart(2, '0')}
      </span>
    </div>
  );
}

function HolderCard({
  holder,
  now,
}: {
  holder: NonNullable<OpsQueue['lock_holder']>;
  now: Date;
}) {
  const accent = ACCENTS[holder.type] ?? ACCENTS.pipeline;
  const label = LOCK_TYPE_LABELS[holder.type] ?? holder.type.toUpperCase();
  return (
    <article
      className="relative bg-[#0f1013] border border-[#1e2127] rounded-[2px] overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${accent.glow} inset, 0 8px 24px -12px ${accent.glow}` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: accent.bar, boxShadow: `0 0 8px ${accent.bar}` }} />
      <div className="px-5 py-4 border-b border-[#1e2127] flex items-center gap-3">
        <Synapse accent={accent} />
        <span
          className="text-[11px] tracking-[0.25em] uppercase"
          style={{ fontFamily: 'var(--font-jb-mono)', color: accent.fg }}
        >
          {label}
        </span>
        <span className="text-[10px] text-[#8b909b]">LOCK HELD</span>
        <span
          className="ml-auto text-[13px] tabular-nums text-[#e4e7eb]"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {elapsed(holder.started_at, now)}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-2">
        {holder.workspace_id && <Meta k="WS" v={trunc(holder.workspace_id, 10)} />}
        {holder.report_id && <Meta k="RPT" v={trunc(holder.report_id, 10)} />}
        {holder.platform_id && (
          <Meta k="PLAT" v={PLATFORM_LABELS[holder.platform_id] ?? holder.platform_id.toUpperCase()} />
        )}
        {holder.failed_reason && <Meta k="REASON" v={holder.failed_reason} />}
        {holder.report_type && <Meta k="TYPE" v={holder.report_type} />}
        {holder.triggered_by && <Meta k="TRIG" v={holder.triggered_by} />}
      </div>
    </article>
  );
}

function FinalizeCard({
  finalize,
  now,
}: {
  finalize: NonNullable<OpsQueue['finalize']>;
  now: Date;
}) {
  const accent = ACCENTS.regenerate;
  return (
    <article
      className="relative bg-[#0f1013] border border-[#1e2127] rounded-[2px] overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${accent.glow} inset, 0 8px 24px -12px ${accent.glow}` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: accent.bar, boxShadow: `0 0 8px ${accent.bar}` }} />
      <div className="px-5 py-4 border-b border-[#1e2127] flex items-center gap-3">
        <Synapse accent={accent} />
        <span
          className="text-[11px] tracking-[0.25em] uppercase"
          style={{ fontFamily: 'var(--font-jb-mono)', color: accent.fg }}
        >
          FINALIZE
        </span>
        <span className="text-[10px] text-[#8b909b]">
          {finalize.trigger === 'auto' ? 'AUTO · post-retry' : 'MANUAL · api'}
        </span>
        <span
          className="ml-auto text-[13px] tabular-nums text-[#e4e7eb]"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {elapsed(finalize.started_at, now)}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-2">
        <Meta k="WS" v={trunc(finalize.workspace_id, 10)} />
        <Meta k="RPT" v={trunc(finalize.report_id, 10)} />
      </div>
    </article>
  );
}

function RetryBatchCard({
  batch,
  now,
}: {
  batch: NonNullable<OpsQueue['retry_batch']>;
  now: Date;
}) {
  const accent = ACCENTS.retry;
  const processed = batch.total - batch.remaining;
  const pct = batch.total ? Math.round((processed / batch.total) * 100) : 0;
  return (
    <article
      className="relative bg-[#0f1013] border border-[#1e2127] rounded-[2px] overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${accent.glow} inset, 0 8px 24px -12px ${accent.glow}` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: accent.bar, boxShadow: `0 0 8px ${accent.bar}` }} />
      <div className="px-5 py-4 border-b border-[#1e2127] flex items-center gap-3">
        <Synapse accent={accent} />
        <span
          className="text-[11px] tracking-[0.25em] uppercase"
          style={{ fontFamily: 'var(--font-jb-mono)', color: accent.fg }}
        >
          RETRY QUEUE
        </span>
        <span
          className="ml-auto text-[13px] tabular-nums text-[#e4e7eb]"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {elapsed(batch.started_at, now)}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span
            className="text-[28px] text-[#e4e7eb] tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-jb-mono)', fontWeight: 500 }}
          >
            {processed}
          </span>
          <span
            className="text-[16px] text-[#8b909b] tabular-nums"
            style={{ fontFamily: 'var(--font-jb-mono)' }}
          >
            / {batch.total}
          </span>
          <span
            className="ml-auto text-[11px] tabular-nums text-[#8b909b]"
            style={{ fontFamily: 'var(--font-jb-mono)' }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-[3px] bg-[#1e2127] overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: accent.bar,
              boxShadow: `0 0 6px ${accent.bar}`,
            }}
          />
        </div>
        <div className="flex flex-col gap-2 pt-2">
          {batch.workspace_id && <Meta k="WS" v={trunc(batch.workspace_id, 10)} />}
          {batch.report_id && <Meta k="RPT" v={trunc(batch.report_id, 10)} />}
          <Meta k="QUEUE" v={`${batch.remaining} waiting`} />
        </div>
      </div>
    </article>
  );
}

function SessionRow({ s }: { s: OpsActiveSession }) {
  const accent = ACCENTS[s.status] ?? ACCENTS.pending;
  const isIdle = s.status === 'pending';
  return (
    <div className="flex items-center gap-4 px-5 py-2.5 border-b border-[#1e2127] last:border-b-0 hover:bg-[#13151a] transition-colors">
      <span
        className="text-[11px] tabular-nums text-[#8b909b] w-[60px]"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        {clockStr(new Date(s.updated_at))}
      </span>
      <span className="w-[16px] flex items-center justify-center">
        {isIdle ? <IdleDot /> : <Synapse accent={accent} size={8} />}
      </span>
      <span
        className="text-[10px] tracking-[0.2em] uppercase w-[72px]"
        style={{ fontFamily: 'var(--font-jb-mono)', color: accent.fg }}
      >
        {s.status}
      </span>
      <span
        className="flex-1 min-w-0 truncate text-[13px] text-[#e4e7eb]"
        style={{ fontFamily: 'var(--font-plex)' }}
      >
        {s.workspace_name ?? trunc(s.workspace_id, 10)}
      </span>
      <span
        className="text-[10px] tracking-[0.15em] uppercase text-[#8b909b]"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        {PLATFORM_LABELS[s.platform_id] ?? s.platform_id.toUpperCase()}
      </span>
    </div>
  );
}

function SessionList({ sessions }: { sessions: OpsActiveSession[] }) {
  if (sessions.length === 0) return null;
  return (
    <div className="bg-[#0f1013] border border-[#1e2127] rounded-[2px] overflow-hidden">
      {sessions.map((s) => (
        <SessionRow key={s.session_id} s={s} />
      ))}
    </div>
  );
}

function ago(iso: string, now: Date): string {
  const diff = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function CompletionRow({ c, now }: { c: OpsCompletion; now: Date }) {
  const accent = ACCENTS[c.status] ?? ACCENTS.pending;
  const [open, setOpen] = useState(false);
  const canExpand = c.status === 'failed';
  return (
    <div className="border-b border-[#1e2127] last:border-b-0">
      <div
        onClick={canExpand ? () => setOpen((v) => !v) : undefined}
        className={`flex items-center gap-4 px-5 py-2.5 transition-colors ${canExpand ? 'cursor-pointer hover:bg-[#13151a]' : ''}`}
      >
        <span
          className="text-[11px] tabular-nums text-[#8b909b] w-[60px]"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {clockStr(new Date(c.updated_at))}
        </span>
        <span
          className="inline-block rounded-full"
          style={{
            width: 6, height: 6, background: accent.fg,
            boxShadow: c.status === 'failed' ? `0 0 6px ${accent.fg}` : 'none',
          }}
        />
        <span
          className="text-[10px] tracking-[0.2em] uppercase w-[60px]"
          style={{ fontFamily: 'var(--font-jb-mono)', color: accent.fg }}
        >
          {c.status}
        </span>
        <span
          className="flex-1 min-w-0 truncate text-[13px] text-[#e4e7eb]"
          style={{ fontFamily: 'var(--font-plex)' }}
        >
          {c.workspace_name ?? trunc(c.workspace_id, 10)}
        </span>
        <span
          className="text-[10px] tracking-[0.15em] uppercase text-[#8b909b] w-[52px] text-right"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {PLATFORM_LABELS[c.platform_id] ?? c.platform_id.toUpperCase()}
        </span>
        {c.status === 'failed' ? (
          <span
            className="text-[10px] tracking-[0.15em] uppercase text-[#fb7185] w-[64px] text-right"
            style={{ fontFamily: 'var(--font-jb-mono)' }}
          >
            {c.failed_reason ?? '—'}
          </span>
        ) : (
          <span className="w-[64px]" />
        )}
        <span
          className="text-[10px] tabular-nums text-[#8b909b] w-[32px] text-right"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {ago(c.updated_at, now)}
        </span>
        <span
          className="w-3 text-[10px] text-[#8b909b] text-center"
          style={{ fontFamily: 'var(--font-jb-mono)' }}
        >
          {canExpand ? (open ? '▾' : '▸') : ''}
        </span>
      </div>
      {open && canExpand && (
        <div className="px-5 pt-2 pb-4 pl-[88px] border-t border-dashed border-[#1e2127]">
          <div
            className="bg-[#14090b] border-l-2 border-[#fb7185] px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap break-words"
            style={{ fontFamily: 'var(--font-jb-mono)', color: c.error_message ? '#fb7185' : '#8b909b' }}
          >
            {c.error_message ?? 'error_message 가 비어있음 — 백엔드에 기록 안 된 실패 (legacy 세션 가능성).'}
          </div>
          <div
            className="mt-1.5 flex items-center gap-3 text-[10px] tracking-[0.15em] uppercase text-[#8b909b]"
            style={{ fontFamily: 'var(--font-jb-mono)' }}
          >
            <span>session</span>
            <span className="text-[#e4e7eb] normal-case tracking-normal">{c.session_id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletionList({ completions, now }: { completions: OpsCompletion[]; now: Date }) {
  if (completions.length === 0) return null;
  return (
    <div className="bg-[#0f1013] border border-[#1e2127] rounded-[2px] overflow-hidden">
      {completions.map((c) => (
        <CompletionRow key={c.session_id} c={c} now={now} />
      ))}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <IdleDot />
      <span
        className="text-[11px] tracking-[0.2em] uppercase text-[#6a6f7a]"
        style={{ fontFamily: 'var(--font-jb-mono)' }}
      >
        {children}
      </span>
    </div>
  );
}

export default function OpsPage() {
  const now = useLiveClock();
  const { data, error, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['ops', 'queue'],
    queryFn: getOpsQueue,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const active = data?.active_sessions ?? [];
  const pending = active.filter((s) => s.status === 'pending');
  const working = active.filter((s) => s.status !== 'pending');
  const recent = data?.recent_completions ?? [];

  const hasLock = Boolean(data?.lock_holder);
  const hasFinalize = Boolean(data?.finalize);
  const hasRetry = Boolean(data?.retry_batch);

  const waitingCount = pending.length + (hasRetry ? 1 : 0);
  const workingCount = working.length + (hasLock ? 1 : 0) + (hasFinalize ? 1 : 0);
  const recentCount = recent.length;

  const statusColor = error ? '#fb7185' : isFetching ? '#38d9c8' : '#7aa2ff';

  return (
    <div
      className={`${plex.variable} ${jbMono.variable} relative min-h-full text-[#e4e7eb] overflow-hidden`}
      style={{
        fontFamily: 'var(--font-plex)',
        background:
          'radial-gradient(ellipse 1100px 600px at 12% -5%, rgba(122, 162, 255, 0.12), transparent 60%), radial-gradient(ellipse 800px 500px at 92% 105%, rgba(192, 132, 252, 0.09), transparent 60%), #07080a',
      }}
    >
      <style jsx global>{`
        @keyframes opsPulse {
          0%, 100% { opacity: 0.7; transform: scale(0.95); }
          50% { opacity: 0.3; transform: scale(1.4); }
        }
        @keyframes opsNodePulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes opsEdgePulse {
          0%, 100% { stroke-opacity: 0.08; }
          50% { stroke-opacity: 0.22; }
        }
        .ops-grid-bg {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 56px 56px;
        }
      `}</style>

      {/* 뉴런 배경 — 콘텐츠 영역은 radial mask 로 페이드, 가장자리에서만 보이도록 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage:
            'radial-gradient(ellipse 55% 45% at 50% 45%, transparent 0%, rgba(0,0,0,0.4) 55%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 55% 45% at 50% 45%, transparent 0%, rgba(0,0,0,0.4) 55%, black 100%)',
        }}
      >
        <NeuralBackground />
      </div>

      <div className="relative ops-grid-bg">
        <div
          className="max-w-6xl mx-auto px-10 py-10 flex flex-col gap-8 relative"
          style={{
            // 콘텐츠 영역 뒤에 은은한 substrate (뉴런과 분리)
            boxShadow:
              'inset 0 0 120px 60px rgba(7, 8, 10, 0.6)',
          }}
        >
          {/* 상단 텔레메트리 스트립 */}
          <div
            className="flex items-center justify-between text-[11px] tracking-[0.25em] uppercase text-[#8b909b] border-b border-[#1e2127] pb-3"
            style={{ fontFamily: 'var(--font-jb-mono)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
              />
              <span style={{ color: statusColor }}>
                {error ? 'OFFLINE' : isFetching ? 'SYNCING' : 'LIVE'}
              </span>
              <span className="text-[#3a3e47] mx-2">/</span>
              <span>POLL · 3.0s</span>
              <span className="text-[#3a3e47] mx-2">/</span>
              <span>HTTP</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="tabular-nums" suppressHydrationWarning>{clockStr(now)}</span>
            </div>
          </div>

          {/* 헤더 */}
          <header className="flex items-end justify-between gap-10">
            <div>
              <div
                className="text-[11px] tracking-[0.3em] uppercase text-[#8b909b] mb-3"
                style={{ fontFamily: 'var(--font-jb-mono)' }}
              >
                OPS · Live pipeline
              </div>
              <h1
                className="text-[44px] leading-[1] text-[#f2f3f5] tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-plex)', fontWeight: 500 }}
              >
                운영 모니터링
              </h1>
              <p
                className="mt-3 text-[14px] text-[#a0a4ac] max-w-[540px] leading-relaxed"
                style={{ fontFamily: 'var(--font-plex)', fontWeight: 400 }}
              >
                현재 서버에서 돌고 있는 수집·분석·재생성 작업 스냅샷. 3초 간격 자동 갱신.
              </p>
            </div>
            {dataUpdatedAt > 0 && (
              <div className="text-right flex flex-col items-end gap-1">
                <Label>last sync</Label>
                <div
                  className="text-[22px] tabular-nums text-[#f2f3f5]"
                  style={{ fontFamily: 'var(--font-jb-mono)', fontWeight: 400 }}
                >
                  {clockStr(new Date(dataUpdatedAt))}
                </div>
              </div>
            )}
          </header>

          {error && (
            <div
              className="border border-[#3a1f24] bg-[#14090b] px-4 py-3 text-[12px] text-[#fb7185]"
              style={{ fontFamily: 'var(--font-jb-mono)' }}
            >
              {error instanceof Error ? error.message : 'query failed'}
            </div>
          )}

          {/* 좌: 대기 · 우: 진행 중 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
            {/* 대기 */}
            <section>
              <SectionHead code="01" title="Waiting" count={waitingCount} />
              <div className="flex flex-col gap-4">
                {hasRetry && data?.retry_batch && (
                  <RetryBatchCard batch={data.retry_batch} now={now} />
                )}
                <SessionList sessions={pending} />
                {waitingCount === 0 && <EmptyLine>no queued work</EmptyLine>}
              </div>
            </section>

            {/* 진행 중 */}
            <section>
              <SectionHead code="02" title="In progress" count={workingCount} />
              <div className="flex flex-col gap-4">
                {hasLock && data?.lock_holder && (
                  <HolderCard holder={data.lock_holder} now={now} />
                )}
                {hasFinalize && data?.finalize && (
                  <FinalizeCard finalize={data.finalize} now={now} />
                )}
                <SessionList sessions={working} />
                {workingCount === 0 && <EmptyLine>no active work</EmptyLine>}
              </div>
            </section>
          </div>

          {/* 최근 완료 */}
          <section className="pt-2">
            <SectionHead code="03" title="Recent · completed" count={recentCount} />
            <CompletionList completions={recent} now={now} />
            {recentCount === 0 && <EmptyLine>no recent completions</EmptyLine>}
          </section>
        </div>
      </div>
    </div>
  );
}

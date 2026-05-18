'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { Check, ChevronDown, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { useWorkspaces } from '@/hooks/workspace/useWorkspaceQuery';
import {
  useCrawlHistory,
  useRetentionMode,
  useWorkspaceSessions,
} from '@/hooks/crawlHistory/useCrawlHistoryQuery';
import type {
  CrawlHistoryChannel,
  CrawlHistoryCritical,
  CrawlHistoryFilters,
  CrawlHistoryItem,
  CrawlHistoryRelevance,
  CrawlHistorySentiment,
} from '@/lib/api/crawlHistoryApi';

const PAGE_SIZE = 20;

const CHANNEL_TABS: { key: CrawlHistoryChannel; label: string }[] = [
  { key: 'news', label: '뉴스' },
  { key: 'blog', label: '블로그' },
  { key: 'youtube', label: '유튜브' },
  { key: 'community', label: '커뮤니티' },
];

const RELEVANCE_OPTIONS: { key: CrawlHistoryRelevance; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'true', label: '관련' },
  { key: 'false', label: '비관련' },
  { key: 'null', label: '미처리' },
];

const CRITICAL_OPTIONS: { key: CrawlHistoryCritical; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'defamation', label: '명예훼손' },
  { key: 'insult', label: '모욕' },
  { key: 'rumor', label: '루머' },
  { key: 'spam', label: '스팸' },
];

const SENTIMENT_OPTIONS: { key: CrawlHistorySentiment; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'positive', label: '긍정' },
  { key: 'neutral', label: '중립' },
  { key: 'negative', label: '부정' },
];

function relevanceBadge(v: boolean | null) {
  if (v === true) return <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">관련</span>;
  if (v === false) return <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">비관련</span>;
  return <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">미처리</span>;
}

function sentimentBadge(s: string | null) {
  if (s === 'positive') return <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">긍정</span>;
  if (s === 'negative') return <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">부정</span>;
  if (s === 'neutral') return <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">중립</span>;
  return <span className="text-[11px] text-slate-300">—</span>;
}

function criticalBadge(t: string | null) {
  if (!t) return <span className="text-[11px] text-slate-300">—</span>;
  const label: Record<string, string> = {
    defamation: '명예훼손',
    insult: '모욕',
    rumor: '루머',
    spam: '스팸',
  };
  return <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">{label[t] ?? t}</span>;
}

function pickEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly { key: T }[],
  fallback: T,
): T {
  return value && allowed.some((o) => o.key === value) ? (value as T) : fallback;
}

function formatKst(iso: string | null) {
  if (!iso) return '—';
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const mm = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function CrawlHistoryClient() {
  const { data: workspaces = [] } = useWorkspaces();
  const { data: retention } = useRetentionMode();

  const router = useRouter();
  const searchParams = useSearchParams();

  // URL ↔ 상태 source of truth = searchParams. 새로고침/공유 시 동일 뷰 복원.
  const workspaceId = searchParams?.get('ws') ?? '';
  const channel = pickEnum<CrawlHistoryChannel>(searchParams?.get('ch'), CHANNEL_TABS, 'news');
  const relevance = pickEnum<CrawlHistoryRelevance>(searchParams?.get('rel'), RELEVANCE_OPTIONS, 'all');
  const critical = pickEnum<CrawlHistoryCritical>(searchParams?.get('cr'), CRITICAL_OPTIONS, 'all');
  const sentiment = pickEnum<CrawlHistorySentiment>(searchParams?.get('sent'), SENTIMENT_OPTIONS, 'all');
  const sessionId = searchParams?.get('sess') || null;
  const startDate = searchParams?.get('start') ?? '';
  const endDate = searchParams?.get('end') ?? '';
  const page = Math.max(0, parseInt(searchParams?.get('p') ?? '0', 10) || 0);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `/crawl-history?${qs}` : '/crawl-history', { scroll: false });
    },
    [router, searchParams],
  );

  const filters = useMemo<CrawlHistoryFilters>(
    () => ({
      workspaceId,
      channel,
      relevance,
      critical,
      sentiment,
      sessionId,
      startDate: startDate || null,
      endDate: endDate || null,
    }),
    [workspaceId, channel, relevance, critical, sentiment, sessionId, startDate, endDate],
  );

  const enabled = !!workspaceId;
  const { data, isLoading, isFetching, refetch } = useCrawlHistory(filters, page, PAGE_SIZE, enabled);
  const { data: sessions = [] } = useWorkspaceSessions(workspaceId, channel);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 lg:p-8 pb-16 min-h-full bg-white flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">크롤 히스토리</h1>
            {retention?.raw_retention_mode ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                보존 모드 ON
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                보존 모드 OFF
              </span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="text-sm flex items-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>

        {/* 필터바 */}
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="워크스페이스">
              <WorkspaceCombobox
                workspaces={workspaces.map((ws) => ({ id: ws.id, label: `${ws.company_name} (${ws.ticker})` }))}
                value={workspaceId}
                onChange={(id) => updateParams({ ws: id || null, sess: null, p: null })}
              />
            </Field>

            <Field label="채널">
              <div className="flex gap-1">
                {CHANNEL_TABS.map((t) => (
                  <button
                    key={t.key}
                    disabled={!workspaceId}
                    onClick={() => updateParams({ ch: t.key === 'news' ? null : t.key, sess: null, p: null })}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      !workspaceId
                        ? 'bg-slate-50 text-slate-300'
                        : channel === t.key
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="관련 여부">
              <SegmentedSelect
                options={RELEVANCE_OPTIONS}
                value={relevance}
                onChange={(v) => updateParams({ rel: v === 'all' ? null : v, p: null })}
                disabled={!workspaceId}
              />
            </Field>

            <Field label="세션">
              <SessionCombobox
                sessions={sessions.map((s) => ({
                  id: s.id,
                  label: `${formatKst(s.created_at)} · ${s.platform_id ?? '—'} · ${s.status}`,
                }))}
                value={sessionId}
                onChange={(id) => updateParams({ sess: id, p: null })}
                disabled={!workspaceId}
              />
            </Field>

            <Field label="Critical Type">
              <ListboxSelect
                options={CRITICAL_OPTIONS}
                value={critical}
                onChange={(v) => updateParams({ cr: v === 'all' ? null : v, p: null })}
                disabled={!workspaceId}
              />
            </Field>

            <Field label="감정">
              <ListboxSelect
                options={SENTIMENT_OPTIONS}
                value={sentiment}
                onChange={(v) => updateParams({ sent: v === 'all' ? null : v, p: null })}
                disabled={!workspaceId}
              />
            </Field>

            <Field label="발행 시작">
              <input
                type="date"
                value={startDate}
                disabled={!workspaceId}
                onChange={(e) => updateParams({ start: e.target.value || null, p: null })}
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
              />
            </Field>

            <Field label="발행 종료">
              <input
                type="date"
                value={endDate}
                disabled={!workspaceId}
                onChange={(e) => updateParams({ end: e.target.value || null, p: null })}
                className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
              />
            </Field>
          </div>
        </div>

        {/* 결과 */}
        {!enabled ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-400">워크스페이스를 선택하세요.</p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-400">불러오는 중…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-400">결과 없음.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                총 {total.toLocaleString()}건 · {page + 1}/{totalPages} 페이지
              </span>
              <div className="flex gap-1">
                <PageBtn
                  disabled={page === 0}
                  onClick={() => updateParams({ p: page - 1 === 0 ? null : String(page - 1) })}
                >
                  ‹ 이전
                </PageBtn>
                <PageBtn
                  disabled={page + 1 >= totalPages}
                  onClick={() => updateParams({ p: String(page + 1) })}
                >
                  다음 ›
                </PageBtn>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="w-8" />
                    <th className="text-left px-3 py-2">제목</th>
                    <th className="text-center px-3 py-2 w-20">관련</th>
                    <th className="text-center px-3 py-2 w-20">감정</th>
                    <th className="text-center px-3 py-2 w-24">Critical</th>
                    <th className="text-center px-3 py-2 w-36">발행</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <Row key={it.id} item={it} expanded={expanded.has(it.id)} onToggle={() => toggleRow(it.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function WorkspaceCombobox({
  workspaces,
  value,
  onChange,
}: {
  workspaces: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const allOption = { id: '', label: '선택' };
  const options = [allOption, ...workspaces];
  const filtered = query
    ? options.filter((w) => w.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const selected = options.find((w) => w.id === value) ?? allOption;

  return (
    <Combobox value={selected} onChange={(w) => onChange(w?.id ?? '')} onClose={() => setQuery('')}>
      <div className="relative w-full">
        <div className="flex items-center border border-slate-200 rounded-md focus-within:border-blue-400 transition-colors bg-white">
          <ComboboxInput
            className="w-full text-sm px-3 py-1.5 outline-none bg-transparent"
            displayValue={(w: { label: string } | null) => w?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="워크스페이스 검색"
          />
          <ComboboxButton className="px-2 text-slate-400 bg-transparent cursor-pointer">
            <ChevronDown size={14} />
          </ComboboxButton>
        </div>
        <ComboboxOptions className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md bg-white border border-slate-200 shadow-lg py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">검색 결과 없음</div>
          ) : (
            filtered.map((w) => (
              <ComboboxOption
                key={w.id || '_all'}
                value={w}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[focus]:bg-blue-50 transition-colors"
              >
                {({ selected: sel }) => (
                  <>
                    <Check size={14} className={sel ? 'text-blue-600' : 'text-transparent'} />
                    <span className={sel ? 'font-semibold text-blue-600' : 'text-slate-700'}>
                      {w.label}
                    </span>
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

function SessionCombobox({
  sessions,
  value,
  onChange,
  disabled,
}: {
  sessions: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const allOption = { id: '', label: '전체' };
  const options = [allOption, ...sessions];
  const filtered = query
    ? options.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const selected = options.find((s) => s.id === (value ?? '')) ?? allOption;

  return (
    <Combobox
      value={selected}
      onChange={(s) => onChange(s?.id || null)}
      onClose={() => setQuery('')}
      disabled={disabled}
    >
      <div className="relative w-full">
        <div
          className={`flex items-center border border-slate-200 rounded-md transition-colors ${
            disabled ? 'bg-slate-50' : 'bg-white focus-within:border-blue-400'
          }`}
        >
          <ComboboxInput
            className="w-full text-sm px-3 py-1.5 outline-none bg-transparent disabled:text-slate-400"
            displayValue={(s: { label: string } | null) => s?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={disabled ? '워크스페이스 먼저 선택' : '세션 검색'}
            disabled={disabled}
          />
          <ComboboxButton className="px-2 text-slate-400 bg-transparent cursor-pointer disabled:cursor-not-allowed">
            <ChevronDown size={14} />
          </ComboboxButton>
        </div>
        <ComboboxOptions className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md bg-white border border-slate-200 shadow-lg py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">검색 결과 없음</div>
          ) : (
            filtered.map((s) => (
              <ComboboxOption
                key={s.id || '_all'}
                value={s}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[focus]:bg-blue-50 transition-colors"
              >
                {({ selected: sel }) => (
                  <>
                    <Check size={14} className={sel ? 'text-blue-600' : 'text-transparent'} />
                    <span className={sel ? 'font-semibold text-blue-600' : 'text-slate-700'}>
                      {s.label}
                    </span>
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

function ListboxSelect<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const current = options.find((o) => o.key === value) ?? options[0];
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative w-full">
        <ListboxButton
          className={`flex w-full items-center gap-2 text-sm border border-slate-200 rounded-md px-3 py-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed ${
            disabled ? 'bg-slate-50 text-slate-300' : 'bg-white hover:bg-slate-50'
          }`}
        >
          <span className={`flex-1 text-left ${disabled ? 'text-slate-300' : 'text-slate-700'}`}>
            {current.label}
          </span>
          <ChevronDown size={14} className={disabled ? 'text-slate-300 shrink-0' : 'text-slate-400 shrink-0'} />
        </ListboxButton>
        <ListboxOptions className="absolute z-50 mt-1 w-full overflow-hidden rounded-md bg-white border border-slate-200 shadow-lg py-1">
          {options.map((o) => (
            <ListboxOption
              key={o.key}
              value={o.key}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[focus]:bg-blue-50 transition-colors"
            >
              {({ selected: sel }) => (
                <>
                  <Check size={14} className={sel ? 'text-blue-600' : 'text-transparent'} />
                  <span className={sel ? 'font-semibold text-blue-600' : 'text-slate-700'}>{o.label}</span>
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

function SegmentedSelect<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.key}
          disabled={disabled}
          onClick={() => onChange(o.key)}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
            disabled
              ? 'bg-slate-50 text-slate-300'
              : value === o.key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PageBtn({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    >
      {children}
    </button>
  );
}

function Row({
  item,
  expanded,
  onToggle,
}: {
  item: CrawlHistoryItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-slate-100 hover:bg-slate-50/60">
        <td className="text-center">
          <button onClick={onToggle} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="text-left text-slate-700 hover:text-blue-700 cursor-pointer line-clamp-1"
            title={item.title}
          >
            {item.title}
          </button>
        </td>
        <td className="px-3 py-2 text-center">{relevanceBadge(item.is_relevant)}</td>
        <td className="px-3 py-2 text-center">{sentimentBadge(item.sentiment)}</td>
        <td className="px-3 py-2 text-center">{criticalBadge(item.critical_type)}</td>
        <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap text-center">
          {formatKst(item.published_at)}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/60 border-t border-slate-100">
          <td />
          <td colSpan={5} className="px-3 py-4">
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-400">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  원문 열기 <ExternalLink size={11} />
                </a>
                <span>·</span>
                <span>platform: {item.platform_id}</span>
                <span>·</span>
                <span>session: {item.session_id ?? '—'}</span>
                <span>·</span>
                <span>created: {formatKst(item.created_at)}</span>
              </div>

              {item.critical_reason && (
                <Section label="Critical 사유">
                  <p className="text-red-700 whitespace-pre-wrap">{item.critical_reason}</p>
                </Section>
              )}

              {item.summary && (
                <Section label="요약">
                  <p className="text-slate-700 whitespace-pre-wrap">{item.summary}</p>
                </Section>
              )}

              <Section label="본문">
                {item.content ? (
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                ) : (
                  <p className="text-slate-400 italic">
                    본문 없음 (보존 모드 OFF 상태에서 분석된 데이터이거나 수집되지 않음)
                  </p>
                )}
              </Section>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

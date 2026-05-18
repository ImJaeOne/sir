'use client';

import type { ReactNode } from 'react';
import { MONITORING_CHANNELS, type Channel } from '@/lib/api/monitoringApi';
import {
  CHANNEL_COLOR,
  PRIMARY,
  PRICE_LINE,
  F_VOLUME,
  SEARCH_NAVER,
  SENTIMENT_COLOR,
} from './shared';

export interface TipPayload {
  name?: string;
  value?: number;
  color?: string;
  payload?: {
    isCarried?: boolean;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    totalVolume?: number;
    [k: string]: unknown;
  };
}

// ── shells ────────────────────────────────────────────────────────────────
export function TooltipShell({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-3.5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.10)] min-w-[180px]">
      <p className="text-[11px] font-bold tracking-[0.04em] text-slate-400 m-0 mb-2 tabular-nums">
        {label?.replace(/-/g, '.')}
      </p>
      {children}
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
  bold,
}: {
  color?: string;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      {color && (
        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      )}
      <span className="text-[12px] text-slate-500">{label}</span>
      <span
        className={`ml-auto text-[12px] tabular-nums ${bold ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}
      >
        {value}
      </span>
    </div>
  );
}

/** 한 행에 두 가격(시·종 또는 저·고) 좌우 배치 */
function PricePairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 py-0.5">
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-slate-500">{leftLabel}</span>
        <span className="ml-auto text-[12px] tabular-nums font-semibold text-slate-700">
          {leftValue}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-slate-500">{rightLabel}</span>
        <span className="ml-auto text-[12px] tabular-nums font-semibold text-slate-700">
          {rightValue}
        </span>
      </div>
    </div>
  );
}

// ── 차트별 tooltip ────────────────────────────────────────────────────────
export function PriceVolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  const fmt = (v: number | null | undefined) => (v != null ? `${v.toLocaleString()}원` : '—');
  return (
    <TooltipShell label={label}>
      <TooltipRow label="시가" value={fmt(d.open)} />
      <TooltipRow label="고가" value={fmt(d.high)} />
      <TooltipRow label="저가" value={fmt(d.low)} />
      <TooltipRow label="종가" value={fmt(d.close)} />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-[12px] text-slate-500">등락률</span>
          <span
            className={`ml-auto text-[12px] tabular-nums font-semibold ${
              hasOhlc ? (upDay ? 'text-red-500' : 'text-blue-500') : 'text-slate-400'
            }`}
          >
            {hasOhlc
              ? `${upDay ? '▲' : '▼'} ${Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%`
              : '—'}
          </span>
        </div>
      </div>
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow
          color={PRIMARY}
          label="수집량"
          value={`${(d.totalVolume ?? 0).toLocaleString()}건`}
        />
      </div>
      {d.isCarried && (
        <p className="text-[10px] text-amber-600 mt-1.5 font-semibold">⚠ 직전 일자 자동 보정</p>
      )}
    </TooltipShell>
  );
}

export function SentimentPriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TipPayload['payload'] & {
    positive?: number;
    neutral?: number;
    negative?: number;
    rawPositive?: number;
    rawNeutral?: number;
    rawNegative?: number;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
  };
  if (!d) return null;
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  const fmt = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');
  const sentParts = [
    { color: SENTIMENT_COLOR.pos, label: '긍정', pct: d.positive ?? 0, count: d.rawPositive ?? 0 },
    { color: SENTIMENT_COLOR.neu, label: '중립', pct: d.neutral ?? 0, count: d.rawNeutral ?? 0 },
    { color: SENTIMENT_COLOR.neg, label: '부정', pct: d.negative ?? 0, count: d.rawNegative ?? 0 },
  ];
  return (
    <TooltipShell label={label}>
      <div className="grid grid-cols-[minmax(140px,auto)_1px_minmax(170px,auto)] gap-3.5 items-start">
        <div>
          {sentParts.map((p, i) => (
            <TooltipRow
              key={i}
              color={p.color}
              label={p.label}
              value={`${p.pct}% (${p.count.toLocaleString()}건)`}
            />
          ))}
        </div>
        <div className="bg-slate-100 self-stretch" />
        <div className="flex flex-col gap-0.5">
          <PricePairRow
            leftLabel="시가"
            leftValue={fmt(d.open)}
            rightLabel="종가"
            rightValue={fmt(d.close)}
          />
          <PricePairRow
            leftLabel="저가"
            leftValue={fmt(d.low)}
            rightLabel="고가"
            rightValue={fmt(d.high)}
          />
          <div className="flex items-center gap-2.5 py-0.5">
            <span className="text-[11.5px] text-slate-500">등락률</span>
            <span
              className={`ml-auto text-[12px] tabular-nums font-semibold ${
                hasOhlc ? (upDay ? 'text-red-500' : 'text-blue-500') : 'text-slate-400'
              }`}
            >
              {hasOhlc
                ? `${upDay ? '▲' : '▼'} ${Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </TooltipShell>
  );
}

export function SearchPriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TipPayload['payload'] & {
    searchNaver?: number | null;
    open?: number | null;
    close?: number | null;
    high?: number | null;
    low?: number | null;
  };
  if (!d) return null;
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  return (
    <TooltipShell label={label}>
      <TooltipRow
        color={SEARCH_NAVER}
        label="네이버"
        value={d.searchNaver != null ? d.searchNaver.toString() : '—'}
      />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {hasOhlc ? (
          <>
            <TooltipRow
              color={PRICE_LINE}
              label="주가 종가"
              value={`${d.close!.toLocaleString()}원`}
              bold
            />
            <div className="grid grid-cols-2 gap-x-3 mt-1 text-[11px] text-slate-400">
              <span>
                시{' '}
                <span className="text-slate-700 font-semibold tabular-nums ml-1">
                  {d.open!.toLocaleString()}
                </span>
              </span>
              <span>
                고{' '}
                <span className="text-slate-700 font-semibold tabular-nums ml-1">
                  {d.high!.toLocaleString()}
                </span>
              </span>
              <span>
                저{' '}
                <span className="text-slate-700 font-semibold tabular-nums ml-1">
                  {d.low!.toLocaleString()}
                </span>
              </span>
              <span className={upDay ? 'text-red-500' : 'text-blue-500'}>
                {upDay ? '▲' : '▼'}{' '}
                {Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%
              </span>
            </div>
          </>
        ) : d.close != null ? (
          <TooltipRow
            color={PRICE_LINE}
            label="주가 종가"
            value={`${d.close.toLocaleString()}원`}
            bold
          />
        ) : (
          <TooltipRow label="주가" value="—" />
        )}
      </div>
    </TooltipShell>
  );
}

export function RiskPriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TipPayload['payload'] & { close?: number | null };
  // 종가 라인/캔들 막대 제외해서 리스크 series 만 표시.
  const riskParts = payload.filter(
    (p) => (p.value ?? 0) > 0 && p.name !== '종가' && p.name !== '주가',
  );
  return (
    <TooltipShell label={label}>
      {riskParts.length === 0 ? (
        <div className="text-[12px] text-slate-400 mb-2">리스크 발생 없음</div>
      ) : (
        riskParts.map((p, i) => (
          <TooltipRow key={i} color={p.color} label={p.name ?? ''} value={`${p.value}건`} />
        ))
      )}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {d?.close != null ? (
          <TooltipRow
            color={PRICE_LINE}
            label="주가 종가"
            value={`${d.close.toLocaleString()}원`}
            bold
          />
        ) : (
          <TooltipRow label="주가" value="—" />
        )}
      </div>
    </TooltipShell>
  );
}

export function ChannelPriceTooltip({
  active,
  payload,
  label,
  visibleChannels,
  showOhlc,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
  visibleChannels: Set<Channel>;
  showOhlc?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TipPayload['payload'] & {
    channelVolume?: Record<Channel, number>;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
  };
  if (!d) return null;
  const visible = MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id));
  const total = visible.reduce((s, c) => s + (d.channelVolume?.[c.id] ?? 0), 0);
  const hasOhlc =
    !!showOhlc && d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  const channelBlock =
    visible.length === 0 ? (
      <div className="text-[12px] text-slate-400">선택된 채널 없음</div>
    ) : (
      <>
        {visible.map((c) => (
          <TooltipRow
            key={c.id}
            color={CHANNEL_COLOR[c.id]}
            label={c.label}
            value={`${(d.channelVolume?.[c.id] ?? 0).toLocaleString()}건`}
          />
        ))}
        <div className="border-t border-slate-100 mt-1.5 pt-1.5">
          <TooltipRow label="합계" value={`${total.toLocaleString()}건`} bold />
        </div>
      </>
    );
  // showOhlc 모드: 휴장일/데이터 누락도 5행 그대로 유지하고 값만 '—' 표시 → 좌우 행 수 안정.
  const fmt = (v: number | null | undefined) => (v != null ? `${v.toLocaleString()}원` : '—');
  const priceBlock = showOhlc ? (
    <>
      <TooltipRow label="시가" value={fmt(d.open)} />
      <TooltipRow label="고가" value={fmt(d.high)} />
      <TooltipRow label="저가" value={fmt(d.low)} />
      <TooltipRow label="종가" value={fmt(d.close)} />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-[12px] text-slate-500">등락률</span>
          <span
            className={`ml-auto text-[12px] tabular-nums font-semibold ${
              hasOhlc ? (upDay ? 'text-red-500' : 'text-blue-500') : 'text-slate-400'
            }`}
          >
            {hasOhlc
              ? `${upDay ? '▲' : '▼'} ${Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%`
              : '—'}
          </span>
        </div>
      </div>
    </>
  ) : d.close != null ? (
    <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close.toLocaleString()}원`} bold />
  ) : (
    <TooltipRow label="주가" value="—" />
  );
  if (showOhlc) {
    return (
      <TooltipShell label={label}>
        <div className="grid grid-cols-[minmax(140px,auto)_1px_minmax(150px,auto)] gap-3.5 items-start">
          <div>{channelBlock}</div>
          <div className="bg-slate-100 self-stretch" />
          <div>{priceBlock}</div>
        </div>
      </TooltipShell>
    );
  }
  return (
    <TooltipShell label={label}>
      {channelBlock}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">{priceBlock}</div>
    </TooltipShell>
  );
}

export function VolumeSearchTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TipPayload['payload'] & {
    totalVolume?: number;
    searchNaver?: number | null;
  };
  if (!d) return null;
  return (
    <TooltipShell label={label}>
      <TooltipRow
        color={F_VOLUME}
        label="수집량"
        value={`${(d.totalVolume ?? 0).toLocaleString()}건`}
        bold
      />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow
          color={SEARCH_NAVER}
          label="네이버"
          value={d.searchNaver != null ? d.searchNaver.toString() : '—'}
        />
      </div>
    </TooltipShell>
  );
}

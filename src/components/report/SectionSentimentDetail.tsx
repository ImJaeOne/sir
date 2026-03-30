'use client';

import { ResponsiveBar } from '@nivo/bar';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReportCard } from '@/components/report/ReportCard';
import { Badge, CountBadge } from '@/components/ui/Badge';

const sentimentData = [
  { channel: '뉴스', 긍정: 67, 중립: 19, 부정: 33 },
  { channel: '블로그', 긍정: 281, 중립: 31, 부정: 10 },
  { channel: '유튜브', 긍정: 31, 중립: 0, 부정: 5 },
  { channel: '종목토론방', 긍정: 308, 중립: 249, 부정: 234 },
  { channel: '디시인사이드', 긍정: 8, 중립: 2, 부정: 3 },
];

const channelItems: Record<string, { title: string; summary?: string; content?: string; sentiment: string; link: string }[]> = {
  뉴스: [
    { title: 'DN오토모티브, 4분기 영업익 1500억…전년비 24.2% ↑', summary: 'DN오토모티브가 4분기 영업이익 1,500억원을 기록하며 전년 대비 24.2% 성장한 실적을 발표했다.', sentiment: 'positive', link: '#' },
    { title: '"DN오토모티브 납 노출 한 달 불구 행정조치 없어"', summary: '울산공장 납 노출 사건 발생 한 달이 지났으나 고용노동부의 행정 조치가 이루어지지 않고 있다는 비판이 제기되고 있다.', sentiment: 'negative', link: '#' },
    { title: '뉴로메카, DN오토모티브 양산공장 자동화 프로젝트 수주', summary: '뉴로메카가 DN오토모티브 양산공장의 협동로봇 자동화 프로젝트를 수주하며 스마트팩토리 확대가 기대된다.', sentiment: 'positive', link: '#' },
  ],
  블로그: [
    { title: 'DN오토모티브 주가, 자회사 가치 재평가 시작', summary: '자회사 DN솔루션즈의 내재가치가 모회사에 반영되기 시작하며 저평가 해소 국면에 진입했다.', sentiment: 'positive', link: '#' },
    { title: '중복상장 금지 수혜주 TOP5 분석', summary: '정부의 중복상장 금지 정책 수혜가 예상되는 상위 5개 종목을 분석했다.', sentiment: 'positive', link: '#' },
    { title: '납 중독 사건 정리 — DN오토모티브 울산공장', summary: '울산공장 납 중독 사건의 타임라인과 경과를 정리한 글이다.', sentiment: 'negative', link: '#' },
  ],
  유튜브: [
    { title: '자동차 부품사인 줄 알았는데 로봇·방산 대장주?', sentiment: 'positive', link: '#' },
    { title: '자회사 중복상장 금지! 가치 재평가 핵심 기대주 TOP5', sentiment: 'positive', link: '#' },
  ],
  종목토론방: [
    { title: '가치에 비해 싼 주식이 제일이다', sentiment: 'positive', link: '#' },
    { title: '중금속 뉴스가 떨어질일이냐?', sentiment: 'negative', link: '#' },
  ],
  디시인사이드: [{ title: 'DN오토모티브 저평가 분석', sentiment: 'positive', link: '#' }],
};

function SentimentTag({ sentiment }: { sentiment: string }) {
  const config: Record<string, { label: string; className: string }> = {
    positive: { label: '긍정', className: 'bg-emerald-50 text-emerald-700' },
    neutral: { label: '중립', className: 'bg-slate-100 text-slate-600' },
    negative: { label: '부정', className: 'bg-red-50 text-red-700' },
  };
  const { label, className } = config[sentiment] ?? config.neutral;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${className}`}>{label}</span>
  );
}

const channelDescriptions: Record<string, string> = {
  '뉴스': '주요 포털 및 언론사 기사 수집',
  '블로그': '주요 포털 블로그 포스팅 수집',
  '유튜브': '영상 요약 기반 분석',
  '종목토론방': '투자자 의견 및 이슈 확산 게시물',
  '디시인사이드': '투자자 의견 및 이슈 확산 게시물',
};

function ChannelAccordion({ name, total, trend }: { name: string; total: number; trend: string }) {
  const [open, setOpen] = useState(false);
  const items = channelItems[name] ?? [];

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer text-left ${open ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-center justify-between flex-1">
          <div>
            <span className="text-sm font-semibold text-slate-700">{name}</span>
            <span className="text-xs text-slate-400 ml-2">{channelDescriptions[name] ?? ''}</span>
          </div>
          <div className="flex items-center gap-2 mr-2">
            <CountBadge count={total} label="수집" />
            <Badge variant={trend.includes('긍정') ? 'green' : 'red'}>{trend}</Badge>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-50 px-4 py-2">
          <ul className="divide-y divide-slate-50">
            {items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <a
                    href={item.link}
                    className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate block transition-colors"
                  >
                    {item.title}
                  </a>
                  {(item.summary || item.content) && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {(item.summary || item.content || '').length > 60
                        ? (item.summary || item.content || '').slice(0, 60) + '…'
                        : (item.summary || item.content)}
                    </p>
                  )}
                </div>
                <SentimentTag sentiment={item.sentiment} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SectionSentimentDetail({ pdfMode = false }: { pdfMode?: boolean }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">온라인 평판 종합</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* 긍정/중립/부정 비율 차트 */}
      <ReportCard
        title="채널별 긍정·중립·부정 여론 비중"
        description="채널별 감정 분포를 100% 누적 막대로 비교하여 여론 구조를 직관적으로 보여줍니다."
      >
        <div className="flex items-stretch gap-3">
          <div className="shrink-0 w-44 flex flex-col justify-evenly pr-3 border-r border-slate-100 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center gap-1.5">
              <span className="text-xs text-emerald-600">긍정적 평판</span>
              <span className="text-2xl font-bold text-emerald-600">
                {sentimentData.reduce((s, d) => s + d.긍정, 0).toLocaleString()}개
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-500">중립적 평판</span>
              <span className="text-2xl font-bold text-slate-600">
                {sentimentData.reduce((s, d) => s + d.중립, 0).toLocaleString()}개
              </span>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col items-center gap-1.5">
              <span className="text-xs text-red-500">부정적 평판</span>
              <span className="text-2xl font-bold text-red-500">
                {sentimentData.reduce((s, d) => s + d.부정, 0).toLocaleString()}개
              </span>
            </div>
          </div>
          <div className={`flex-1 ${pdfMode ? "h-48" : "h-64"}`}>
            <ResponsiveBar
              data={sentimentData.map((d) => {
                const total = d.긍정 + d.중립 + d.부정;
                return {
                  channel: d.channel,
                  긍정: total > 0 ? Math.round((d.긍정 / total) * 100) : 0,
                  중립: total > 0 ? Math.round((d.중립 / total) * 100) : 0,
                  부정: total > 0 ? Math.round((d.부정 / total) * 100) : 0,
                };
              })}
              keys={['긍정', '중립', '부정']}
              indexBy="channel"
              layout="vertical"
              margin={{ top: 20, right: 10, bottom: 20, left: 35 }}
              padding={0.65}
              colors={['#34d399', '#cbd5e1', '#f87171']}
              borderRadius={3}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                tickValues: [0, 20, 40, 60, 80, 100],
                format: (v) => `${v}%`,
              }}
              axisBottom={{
                tickSize: 0,
                tickPadding: 8,
              }}
              valueScale={{ type: 'linear', min: 0, max: 100 }}
              enableGridX={false}
              enableGridY={true}
              gridYValues={[0, 20, 40, 60, 80, 100]}
              enableLabel={false}
              theme={{
                axis: { ticks: { text: { fontSize: 11, fill: '#94a3b8' } } },
                grid: { line: { stroke: '#f1f5f9' } },
              }}
              tooltip={({ indexValue }) => {
                const raw = sentimentData.find(d => d.channel === indexValue);
                if (!raw) return null;
                const total = raw.긍정 + raw.중립 + raw.부정;
                return (
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-md text-xs min-w-[160px]">
                  <p className="font-semibold text-slate-700 mb-1">{indexValue} <span className="font-normal text-slate-400">총 {total.toLocaleString()}건</span></p>
                  <p className="text-emerald-600">긍정: {total > 0 ? Math.round(raw.긍정 / total * 100) : 0}% ({raw.긍정.toLocaleString()}건)</p>
                  <p className="text-slate-500">중립: {total > 0 ? Math.round(raw.중립 / total * 100) : 0}% ({raw.중립.toLocaleString()}건)</p>
                  <p className="text-red-500">부정: {total > 0 ? Math.round(raw.부정 / total * 100) : 0}% ({raw.부정.toLocaleString()}건)</p>
                </div>
                );
              }}
            />
          </div>
        </div>
      </ReportCard>

      {/* 채널별 수집 데이터 상세 */}
      <ReportCard
        title="채널별 수집 데이터 상세 보기"
        description="각 채널명을 클릭하면 접고 펼치는 방식으로 수집된 세부 콘텐츠 목록을 확인할 수 있습니다."
      >
        <div className="flex flex-col gap-2">
          <ChannelAccordion name="뉴스" total={119} trend="긍정 우세" />
          <ChannelAccordion name="블로그" total={322} trend="긍정 우세" />
          <ChannelAccordion name="유튜브" total={36} trend="긍정 우세" />
          <ChannelAccordion name="종목토론방" total={791} trend="긍정 우세" />
          <ChannelAccordion name="디시인사이드" total={13} trend="긍정 우세" />
        </div>
      </ReportCard>
    </section>
  );
}

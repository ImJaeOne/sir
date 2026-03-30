'use client';

import { ReportCard } from '@/components/report/ReportCard';

interface TopItem {
  rank: number;
  title: string;
  summary: string;
  views?: number;
  link: string;
}

interface ChannelTop {
  title: string;
  description: string;
  items: TopItem[];
}

const topByChannel: ChannelTop[] = [
  {
    title: '뉴스 TOP 3',
    description: '가장 많이 발행된 기사 수 기준으로 선정되었습니다.',
    items: [
    { rank: 1, title: 'DN오토모티브 울산공장 납 중독 집단 노출 사건', summary: '26건 보도, 기업 신뢰 위기', link: '#' },
    { rank: 2, title: 'DN오토모티브 협동로봇 자동화 프로젝트 수주', summary: '10건 보도, 스마트팩토리 확대', link: '#' },
    { rank: 3, title: 'DN오토모티브 주가 급등 및 상한가 기록', summary: '14건 보도, 밸류업 기대감', link: '#' },
  ]},
  {
    title: '블로그 TOP 3',
    description: 'AI 분석 기반 영향력이 높은 포스팅 기준으로 선정되었습니다.',
    items: [
    { rank: 1, title: 'DN오토모티브 주총후기 및 의견', summary: 'PER 4.3배 저평가 분석', link: '#' },
    { rank: 2, title: 'DN오토모티브 주가, 영업이익 5,279억 원과 자회사 가치', summary: '심층 재무 분석', link: '#' },
    { rank: 3, title: '중복상장금지 수혜 — DN솔루션즈 가치 재평가', summary: '정책 수혜 분석', link: '#' },
  ]},
  {
    title: '유튜브 TOP 3',
    description: '가장 많이 조회된 영상 기준으로 선정되었습니다.',
    items: [
    { rank: 1, title: '오늘의 주식 — DN오토모티브 상한가 분석', summary: '조회수 47,607회', views: 47607, link: '#' },
    { rank: 2, title: '자동차 부품사인 줄 알았는데 로봇·방산 대장주?', summary: '조회수 40,367회', views: 40367, link: '#' },
    { rank: 3, title: '초봉 6천 알짜기업 떴다!', summary: '조회수 29,701회', views: 29701, link: '#' },
  ]},
  {
    title: '네이버 종목토론방 TOP 3',
    description: '가장 많이 조회된 게시글 기준으로 선정되었습니다.',
    items: [
    { rank: 1, title: '가치에 비해 싼 주식이 제일이다', summary: 'DN솔루션즈 순이익 분석', views: 1523, link: '#' },
    { rank: 2, title: '하나증권은 DN오토모티브에 대해 여전히 저평가', summary: '증권사 리포트 인용', views: 1105, link: '#' },
    { rank: 3, title: '글로벌 자동차 기업 공작기계 체인 공급망', summary: 'GM 라인 분석', views: 892, link: '#' },
  ]},
  {
    title: '디시인사이드 TOP 3',
    description: '가장 많이 조회된 게시글 기준으로 선정되었습니다.',
    items: [
    { rank: 1, title: 'DN오토모티브 저평가 분석', summary: '밸류업 기대감 분석', views: 342, link: '#' },
    { rank: 2, title: '상한가 이후 전망', summary: '주가 반등세 분석', views: 287, link: '#' },
    { rank: 3, title: '중금속 이슈 정리', summary: '납 중독 사건 타임라인', views: 215, link: '#' },
  ]},
];

export function SectionTopContent() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">채널별 상위 콘텐츠</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {topByChannel.map(ch => (
          <ReportCard key={ch.title} title={ch.title} description={ch.description}>
            <div className="flex flex-col gap-2.5">
              {ch.items.map(item => (
                <a key={item.rank} href={item.link} className="flex items-start gap-3 group hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2 transition-colors">
                  <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                    item.rank === 1 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                    {item.views != null
                      ? <p className="text-xs text-slate-400 mt-0.5">조회수 {item.views.toLocaleString()}회</p>
                      : item.summary && <p className="text-xs text-slate-400 mt-0.5">{item.summary}</p>
                    }
                  </div>
                </a>
              ))}
            </div>
          </ReportCard>
        ))}
      </div>
    </section>
  );
}

'use client';

import { ReportCard } from './ReportCard';

interface StrategyItem {
  background: string;
  proposal: string;
}

const strategiesByChannel: Record<string, StrategyItem[]> = {
  '뉴스 채널 대응 전략': [
    {
      background: '울산공장 납 중독 노출 및 건강진단 수치 조작 의혹이 네이버 뉴스를 통해 반복적으로 집중 보도되고 있으며, 전문가 단체·시민단체·금속노조가 동시에 문제를 제기하며 정부 개입 요구 여론이 확산되고 있다.',
      proposal: '즉시(48시간 이내) CEO 또는 대표이사 명의의 공식 입장문을 자사 홈페이지 및 보도자료 채널을 통해 배포한다. 입장문에는 수치 조작 의혹에 대한 사실관계 해명, 독립 기관 조사 착수 계획, 재발 방지 로드맵을 포함한다.',
    },
    {
      background: '네이버 뉴스 감성 분석 결과 긍정 67건, 부정 33건으로 수치상 긍정 비율이 높으나, 부정 콘텐츠가 모두 납 중독 은폐라는 단일 고위험 이슈에 집중되어 있어 위기 확산력이 매우 높다.',
      proposal: 'IR 팀과 홍보팀 간 협업 체계를 구성하고, 실적·사업 확장 관련 긍정 메시지는 노동 안전 이슈의 공식 입장 발표 이후 순차 공개하는 이슈 분리 전략을 수립한다.',
    },
  ],
  'SNS 채널 대응 전략': [
    {
      background: '유튜브·블로그 채널 내 긍정 여론이 압도적이나, 대부분 외부 크리에이터/블로거의 자생적 콘텐츠에 의존하고 있어 기업이 메시지를 통제하거나 정확성을 보장하기 어려운 구조다.',
      proposal: '이번 주 내로 IR 팀과 협력하여 공식 유튜브 콘텐츠 기획안을 수립한다. Heller 인수 시너지, 공작기계 포트폴리오 확대, 글로벌 거점 현황을 다루는 공식 영상을 제작·배포한다.',
    },
    {
      background: '블로그 여론 내 높은 차입금 부담과 DN솔루션즈 구조 변화에 대한 불확실성이 부정·중립 여론의 주된 원인으로 식별된다.',
      proposal: '다음 분기 실적 발표 시점에 맞춰 부채 관리 로드맵 원페이저를 제작하여 네이버 블로그 공식 채널 및 투자자 커뮤니티에 동시 배포한다.',
    },
  ],
  '커뮤니티 채널 대응 전략': [
    {
      background: '네이버 종목토론방 내에서 장기 투자자와 단기 투자자 간 심리적 분열이 뚜렷하게 관찰된다. 긍정 308건의 상당 부분이 기대 기반 의견이며, 정책 모멘텀 소진 시 급격한 심리 반전 위험이 존재한다.',
      proposal: '이번 달 내 기업 자체 펀더멘털 중심의 투자자 교육 콘텐츠를 제작하여 배포한다. 축전지·자동차부품 사업 내 시장 점유율과 수익성 지표, 글로벌 전동화 트렌드 대응 전략을 포함한다.',
    },
    {
      background: '중복상장 금지 규제와 정부 밸류업 정책이 상한가의 직접적 촉매로 작용했음에도, 회사 측의 공식 언급이 부재한 상태에서 개인 투자자들이 자의적 해석을 바탕으로 여론을 형성하고 있다.',
      proposal: '정부 밸류업 프로그램 참여 여부 및 자사 적용 계획을 이번 주 내 공식 입장으로 표명한다. 금융위원회 밸류업 공시 플랫폼에 자발적 참여 선언을 게시한다.',
    },
  ],
};

function StrategyCard({ channel, items }: { channel: string; items: StrategyItem[] }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_0_1px_rgba(241,245,249,1),0_1px_2px_rgba(0,0,0,0.05)]">
      <h4 className="text-sm font-bold text-slate-800">{channel}</h4>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">전략 도출 배경</p>
            <p className="text-sm text-slate-600 leading-relaxed">{item.background}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1.5">전략 제안</p>
            <p className="text-sm text-slate-700 leading-relaxed">{item.proposal}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionStrategy() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">대응 전략 제안</h2>
        <div className="h-px bg-slate-200 flex-1" />
      </div>
      <ReportCard title="채널별 대응 전략" description="이번 주 온라인 여론 분석 결과를 바탕으로, 각 채널별 긍정 여론 확산 및 부정 여론 완화를 위한 주요 전략을 확인할 수 있습니다.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.entries(strategiesByChannel).map(([channel, items]) => (
            <StrategyCard key={channel} channel={channel} items={items} />
          ))}
        </div>
      </ReportCard>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-center">
        <p className="text-white text-sm mb-1">전략 실행이 어렵다면, SIR 팀이 함께 대응합니다.</p>
        <p className="text-blue-200 text-xs mb-5">위 제안을 기반으로 전문 컨설턴트가 실행 계획을 수립하고 모니터링합니다.</p>
        <a href="https://www.naver.com" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-blue-600 font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer shadow-sm">
          서비스 신청하기
        </a>
      </div>
    </section>
  );
}

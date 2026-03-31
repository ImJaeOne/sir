'use client';

import { ReportCard } from './ReportCard';
import type { StrategyGroup } from '@/lib/api/reportApi';

function StrategyCard({ platform, backgrounds, proposals }: StrategyGroup) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_0_1px_rgba(241,245,249,1),0_1px_2px_rgba(0,0,0,0.05)]">
      <h4 className="text-sm font-bold text-slate-800">{platform}</h4>
      {backgrounds.map((bg, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">전략 도출 배경</p>
            <p className="text-sm text-slate-600 leading-relaxed">{bg}</p>
          </div>
          {proposals[i] && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1.5">전략 제안</p>
              <p className="text-sm text-slate-700 leading-relaxed">{proposals[i]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SectionStrategy({ strategies = [] }: { strategies?: StrategyGroup[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">대응 전략 제안</h2>
        <div className="h-px bg-slate-200 flex-1" />
      </div>
      <ReportCard title="채널별 대응 전략" description="이번 주 온라인 여론 분석 결과를 바탕으로, 각 채널별 긍정 여론 확산 및 부정 여론 완화를 위한 주요 전략을 확인할 수 있습니다.">
        {strategies.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {strategies.map((s) => (
              <StrategyCard key={s.platform} {...s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">전략 데이터가 없습니다. 전략 생성을 실행해주세요.</p>
        )}
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

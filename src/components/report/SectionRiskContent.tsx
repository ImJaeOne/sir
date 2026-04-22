'use client';

import { ReportCard } from './ReportCard';
import type { RiskItem } from '@/lib/api/reportApi';

const criticalTypeLabels: Record<string, { label: string; className: string }> = {
  defamation: { label: '명예훼손', className: 'bg-red-50 text-red-700' },
  insult: { label: '욕설/비방', className: 'bg-orange-50 text-orange-700' },
  rumor: { label: '루머', className: 'bg-blue-50 text-blue-700' },
  spam: { label: '스팸', className: 'bg-slate-100 text-slate-600' },
};

const criticalTypeDescriptions: Record<string, string> = {
  defamation: '구체적 사실 또는 허위사실로 평판을 떨어뜨리는 게시물',
  insult: '사실 주장 없이 상대를 깎아내리거나 조롱하는 게시물',
  rumor: '확인되지 않은 내용을 추정형으로 퍼뜨리는 게시물',
  spam: '리딩방 홍보/반복성 도배/상업성 링크 유도 게시물',
};

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '커뮤니티',
  dcinside: '커뮤니티',
};

export function SectionRiskContent({ riskItems = [] }: { riskItems?: RiskItem[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">리스크 콘텐츠 관리</h2>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      {/* 탐지 내역 */}
      <ReportCard>
        <h4 className="text-sm font-semibold text-slate-700 mb-1">리스크 콘텐츠 탐지 내역</h4>
        <p className="text-xs text-slate-400 mb-1">부정적 게시물 중 위험 수위가 높은 게시물을 AI가 분류한 것으로 고객 확인을 거쳐 신고 및 게시물 삭제 등의 후속조치 여부 결정이 필요합니다.</p>
        <p className="text-xs text-red-400 mb-3">※ SIR 팀에 신고 대행을 요청하거나 직접 신고 처리를 통해 리스크를 해결하시기 바랍니다.</p>
        {riskItems.length > 0 ? (
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">탐지일</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">채널명</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">세부내용</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {riskItems.map((item) => {
                const typeInfo = criticalTypeLabels[item.critical_type] ?? { label: item.critical_type, className: 'bg-slate-100 text-slate-600' };
                const date = item.published_at ? item.published_at.slice(0, 10).replace(/-/g, '.') : '';
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-xs text-slate-400 text-center">{date}</td>
                    <td className="py-3 px-3 text-xs text-slate-500 text-center">{PLATFORM_LABELS[item.platform_id] ?? item.platform_id}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${typeInfo.className}`}>{typeInfo.label}</span>
                          <span className="text-xs text-slate-500">{criticalTypeDescriptions[item.critical_type] ?? item.critical_type}</span>
                        </div>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-blue-600 hover:underline transition-colors pl-0.5">
                          {item.title}
                        </a>
                        {item.critical_reason && (
                          <p className="text-xs text-slate-400 leading-relaxed pl-0.5">{item.critical_reason}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                        신고 대행 요청
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-400">탐지된 리스크 콘텐츠가 없습니다.</p>
        )}
      </ReportCard>
    </section>
  );
}

'use client';

import { ReportCard } from './ReportCard';
import { Tooltip } from '@/components/ui/Tooltip';

const criticalTypeLabels: Record<string, { label: string; className: string }> = {
  stock_manipulation: { label: '시세조종', className: 'bg-red-50 text-red-700' },
  false_info: { label: '허위정보', className: 'bg-orange-50 text-orange-700' },
  defamation: { label: '명예훼손', className: 'bg-red-50 text-red-700' },
  threat: { label: '위협', className: 'bg-red-50 text-red-700' },
  ad: { label: '광고', className: 'bg-blue-50 text-blue-700' },
  spam: { label: '스팸', className: 'bg-slate-100 text-slate-600' },
};

const criticalTypeDescriptions: Record<string, string> = {
  stock_manipulation: '시세 조종이 의심되는 게시물',
  false_info: '허위 정보가 사실처럼 확산되는 게시물',
  defamation: '기업/인물에 대한 명예훼손성 게시물',
  threat: '특정인을 대상으로 한 위협/협박 게시물',
  ad: '기업 관련 광고/홍보성 게시물',
  spam: '스팸/도배/무관 광고 게시물',
};

const riskItems = [
  { date: '2026.03.12', channel: '뉴스', type: 'defamation', title: 'DN오토모티브, 의무 검진 앞두고 주사 접종해 납 수치 낮췄다?', critical_reason: '건강진단 수치 조작을 단정적으로 서술하며, 확인되지 않은 사실을 기정사실화하여 기업 신뢰를 훼손하는 콘텐츠입니다.', link: '#' },
  { date: '2026.03.13', channel: '뉴스', type: 'defamation', title: '근로자 납 노출 은폐 의혹 DN오토모티브…사측은 법적 기준 준수', critical_reason: '조직적 은폐를 단정적으로 서술하며, 사실관계 확인 없이 기업의 의도적 행위로 프레이밍하는 콘텐츠입니다.', link: '#' },
  { date: '2026.03.14', channel: '뉴스', type: 'defamation', title: 'DN오토모티브, 납 중독 은폐 의혹 확산…노동계 작업중지 요구', critical_reason: '은폐 의혹을 반복적으로 단정하며, 노동계 요구사항을 기정사실화하여 기업 이미지를 훼손하는 콘텐츠입니다.', link: '#' },
  { date: '2026.03.16', channel: '종토방', type: 'spam', title: '하 ,, 진짜 미치게써여 ㅠㅠ', critical_reason: '특정 리딩방 가입을 유도하는 스팸성 게시글로, 투자자를 현혹할 수 있는 콘텐츠입니다.', link: '#' },
  { date: '2026.03.18', channel: '종토방', type: 'threat', title: '벌어지같은것들', critical_reason: '불특정 다수에 대한 가족 저주 및 협박성 표현이 포함된 위협 콘텐츠입니다.', link: '#' },
];

const processedItems = [
  { date: '2026.03.10', channel: '뉴스', reportChannel: '네이버 뉴스', type: 'false_info', status: '삭제 완료', statusColor: 'text-emerald-600 bg-emerald-50' },
  { date: '2026.03.11', channel: '종토방', reportChannel: '네이버 종목토론방', type: 'spam', status: '처리 대기중', statusColor: 'text-amber-600 bg-amber-50' },
  { date: '2026.03.12', channel: '블로그', reportChannel: '네이버 블로그', type: 'defamation', status: '신고 반려', statusColor: 'text-red-600 bg-red-50', rejectReason: '플랫폼 커뮤니티 가이드라인 위반 사항에 해당하지 않아 반려되었습니다.' },
];

export function SectionRiskContent() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">리스크 콘텐츠 관리</h2>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      {/* 탐지 내역 */}
      <ReportCard
        title="리스크 콘텐츠 탐지 내역"
        description="부정적 게시물 중 위험 수위가 높은 게시물을 AI가 분류한 것으로 고객 확인을 거쳐 신고 및 게시물 삭제 등의 후속조치 여부 결정이 필요합니다."
        emphasis="※ SIR 팀에 신고 대행을 요청하거나 직접 신고 처리를 통해 리스크를 해결하시기 바랍니다."
      >
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
            {riskItems.map((item, i) => {
              const typeInfo = criticalTypeLabels[item.type] ?? { label: item.type, className: 'bg-slate-100 text-slate-600' };
              return (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-xs text-slate-400 text-center">{item.date}</td>
                  <td className="py-3 px-3 text-xs text-slate-500 text-center">{item.channel}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${typeInfo.className}`}>{typeInfo.label}</span>
                        <span className="text-xs text-slate-500">{criticalTypeDescriptions[item.type] ?? item.type}</span>
                      </div>
                      <a href={item.link} className="text-sm font-medium text-slate-700 hover:text-blue-600 hover:underline transition-colors pl-0.5">
                        {item.title}
                      </a>
                      <p className="text-xs text-slate-400 leading-relaxed pl-0.5">{item.critical_reason}</p>
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
      </ReportCard>

      {/* 처리 결과 */}
      <ReportCard title="리스크 콘텐츠 처리 결과" description="지난 주 SIR 팀에 신고 접수된 콘텐츠의 처리 상태를 확인할 수 있습니다.">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[24%]" />
            <col className="w-[24%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">신고일</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">채널명</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">신고 채널</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">신고 게시물 유형</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">상태</th>
            </tr>
          </thead>
          <tbody>
            {processedItems.map((item, i) => {
              const typeInfo = criticalTypeLabels[item.type] ?? { label: item.type, className: 'bg-slate-100 text-slate-600' };
              return (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-xs text-slate-400 text-center">{item.date}</td>
                  <td className="py-3 px-3 text-xs text-slate-500 text-center">{item.channel}</td>
                  <td className="py-3 px-3 text-xs text-slate-500 text-center">{item.reportChannel}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeInfo.className}`}>{typeInfo.label}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.statusColor}`}>{item.status}</span>
                      {item.rejectReason && <Tooltip text={item.rejectReason} position="bottom" />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ReportCard>
    </section>
  );
}

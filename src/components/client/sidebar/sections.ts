import { HighlightSidebarIcon } from '@/components/icons/HighlightSidebarIcon';
import { OnlineReputationSidebarIcon } from '@/components/icons/OnlineReputationSidebarIcon';
// import { RiskContentSidebarIcon } from '@/components/icons/RiskContentSidebarIcon';
import { StrategySidebarIcon } from '@/components/icons/StrategySidebarIcon';

type IconComponent = typeof HighlightSidebarIcon;

export interface ClientReportSection {
  id: string;
  label: string;
  Icon: IconComponent;
}

export function getClientReportSections(reportType: string | undefined | null): ClientReportSection[] {
  const isDaily = reportType === 'daily';
  const isInitial = reportType === 'initial';
  const periodLabel = isDaily ? '일간' : isInitial ? '월간' : '주간';

  const sections: ClientReportSection[] = [
    { id: 'section-highlight', label: `${periodLabel} 하이라이트`, Icon: HighlightSidebarIcon },
    { id: 'section-reputation', label: '기업 평판 분석', Icon: OnlineReputationSidebarIcon },
  ];
  // 리스크 콘텐츠 관리 섹션은 보고서 상단 탭/모바일 섹션 메뉴에서 임시 비노출.
  // sections.push({ id: 'section-risk', label: '리스크 콘텐츠 관리', Icon: RiskContentSidebarIcon });
  if (!isDaily) {
    sections.push({ id: 'section-strategy', label: '평판 제고 전략 제안', Icon: StrategySidebarIcon });
  }
  return sections;
}

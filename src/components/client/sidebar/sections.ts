import { HighlightSidebarIcon } from '@/components/icons/HighlightSidebarIcon';
import { OnlineReputationSidebarIcon } from '@/components/icons/OnlineReputationSidebarIcon';
import { TopContentSidebarIcon } from '@/components/icons/TopContentSidebarIcon';
import { RiskContentSidebarIcon } from '@/components/icons/RiskContentSidebarIcon';
import { StrategySidebarIcon } from '@/components/icons/StrategySidebarIcon';

type IconComponent = typeof HighlightSidebarIcon;

export interface ClientReportSection {
  id: string;
  label: string;
  Icon: IconComponent;
}

export function getClientReportSections(isDaily: boolean): ClientReportSection[] {
  const sections: ClientReportSection[] = [
    { id: 'section-highlight', label: isDaily ? '일간 하이라이트' : '주간 하이라이트', Icon: HighlightSidebarIcon },
    { id: 'section-reputation', label: '온라인 평판 종합', Icon: OnlineReputationSidebarIcon },
  ];
  if (!isDaily) {
    sections.push({ id: 'section-top-content', label: '채널별 상위 콘텐츠', Icon: TopContentSidebarIcon });
  }
  sections.push({ id: 'section-risk', label: '리스크 콘텐츠 관리', Icon: RiskContentSidebarIcon });
  if (!isDaily) {
    sections.push({ id: 'section-strategy', label: '대응 전략 제안', Icon: StrategySidebarIcon });
  }
  return sections;
}

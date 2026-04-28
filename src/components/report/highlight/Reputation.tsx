import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { SummaryAccordion } from '@/components/report/highlight/SummaryAccordion';
import type { SummarySection } from '@/lib/api/reportApi';

export function Reputation({ summary, pdfMode = false, isInitial = false }: { summary: SummarySection[]; pdfMode?: boolean; isInitial?: boolean }) {
  const title = isInitial ? '월간 총평' : '주간 총평';
  return (
    <ReportSubSection title={title}>
      <ReportCard px={20} py={5}>
        {summary && summary.length > 0 ? (
          <SummaryAccordion sections={summary} pdfMode={pdfMode} />
        ) : (
          <EmptyState message={'총평 데이터가 없습니다.\n총평 생성을 실행해주세요.'} />
        )}
      </ReportCard>
    </ReportSubSection>
  );
}

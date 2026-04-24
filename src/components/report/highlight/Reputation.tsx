import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { SummaryAccordion } from '@/components/report/highlight/SummaryAccordion';
import type { SummarySection } from '@/lib/api/reportApi';

export function Reputation({ summary, pdfMode = false }: { summary: SummarySection[]; pdfMode?: boolean }) {
  return (
    <ReportSubSection title="주간 총평">
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

// 보고서 type 별 기간 표현 — 전략 desc, 리스크 처리 결과 desc 등에서 공통 사용
export function strategyPeriodPhrase(reportType: string | undefined | null): string {
  if (reportType === 'daily') return '오늘';
  if (reportType === 'initial') return '이번 달';
  return '이번 주';
}

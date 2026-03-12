import type { AnalysisContext } from '@/types/context';

// TODO: API 연동 후 제거
export const MOCK_CONTEXTS: AnalysisContext[] = [
  {
    id: 'ctx-1',
    name: '삼성전자 평판 분석',
    keywords: ['삼성전자', 'Samsung Electronics'],
    dateRange: { start: '2026-03-03', end: '2026-03-10' },
    createdAt: '2026-03-10',
  },
  {
    id: 'ctx-2',
    name: 'LG에너지솔루션 이슈 모니터링',
    keywords: ['LG에너지솔루션', 'LGES'],
    dateRange: { start: '2026-03-10', end: '2026-03-11' },
    createdAt: '2026-03-11',
  },
];

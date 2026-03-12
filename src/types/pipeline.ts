export type StageId = 'crawling' | 'analysis' | 'content' | 'report' | 'email';
export type StageStatus = 'idle' | 'loading' | 'completed';

export interface StageResult {
  summary: string;
  items: string[];
}

export interface CrawlArticle {
  title: string;
  url: string;
}

export interface PlatformCrawlResult {
  platformId: string;
  platformLabel: string;
  category: string;
  articles: CrawlArticle[];
}

export interface FlaggedContent {
  title: string;
  url: string;
  sentiment: 'negative' | 'caution';
  reason: string;
}

export interface AnalysisArticle {
  title: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PlatformAnalysis {
  platformId: string;
  platformLabel: string;
  category: string;
  sirScore: number;
  positive: number;
  neutral: number;
  negative: number;
  articles: AnalysisArticle[];
  flagged: FlaggedContent[];
}

export interface ContentStrategy {
  url: string;
  title: string;
  platform: string;
  category: string;
  reportable: boolean;
  strategy?: string;
  reportReason?: string;
}

export interface PipelineStage {
  id: StageId;
  label: string;
  buttonText: string;
  result: StageResult;
}

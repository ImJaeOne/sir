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

export interface PipelineStage {
  id: StageId;
  label: string;
  buttonText: string;
  result: StageResult;
}

import { z } from 'zod';

// ── 세션 ──

export const crawlStatusEnum = z.enum(['crawling', 'analyzing', 'clustering', 'done', 'failed']);
export const crawlFailedAtEnum = z.enum(['crawling', 'analyzing', 'clustering']);

export const crawlSessionSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  platform_id: z.string().nullable(),
  period_start: z.string().nullable(),
  period_end: z.string().nullable(),
  total_items: z.number(),
  sir_score: z.number().nullable(),
  created_at: z.string(),
  status: crawlStatusEnum,
  failed_at: crawlFailedAtEnum.nullable(),
});

// ── 뉴스 ──

export const newsItemSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  session_id: z.string().uuid(),
  platform_id: z.string(),
  title: z.string(),
  link: z.string(),
  published_at: z.string().nullable(),
  source: z.string().nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  summary: z.string().nullable(),
  cluster_id: z.string().uuid().nullable(),
  created_at: z.string(),
});

export const clusterSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  session_id: z.string().uuid(),
  representative_title: z.string(),
  summary: z.string().nullable(),
  article_count: z.number(),
  is_relevant: z.boolean().nullable(),
  created_at: z.string(),
});

export const strategySchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  session_id: z.string().uuid(),
  platform_id: z.string(),
  strategy_positive: z.string().nullable(),
  strategy_negative: z.string().nullable(),
  created_at: z.string(),
});

// ── 커뮤니티 ──

export const criticalTypeEnum = z.enum(['market_manipulation', 'rumor', 'legal_risk', 'threat']);

export const communityItemSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  session_id: z.string().uuid().nullable(),
  platform_id: z.string(),
  nid: z.string().nullable(),
  title: z.string(),
  link: z.string(),
  content: z.string().nullable(),
  published_at: z.string().nullable(),
  views: z.number(),
  likes: z.number(),
  dislikes: z.number(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  critical_type: criticalTypeEnum.nullable(),
  is_cleanbot: z.boolean(),
  created_at: z.string(),
});

// ── 타입 export ──

export type CrawlSession = z.infer<typeof crawlSessionSchema>;
export type CrawlStatus = z.infer<typeof crawlStatusEnum>;
export type CrawlFailedAt = z.infer<typeof crawlFailedAtEnum>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type Cluster = z.infer<typeof clusterSchema>;
export type Strategy = z.infer<typeof strategySchema>;
export type CommunityItem = z.infer<typeof communityItemSchema>;
export type CriticalType = z.infer<typeof criticalTypeEnum>;

/** @deprecated crawlItemSchema → newsItemSchema로 변경됨 */
export const crawlItemSchema = newsItemSchema;
/** @deprecated CrawlItem → NewsItem으로 변경됨 */
export type CrawlItem = NewsItem;

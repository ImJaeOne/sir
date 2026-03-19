import { z } from 'zod';

export const crawlItemSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  platform_id: z.string(),
  title: z.string(),
  link: z.string(),
  published_at: z.string().nullable(),
  source: z.string().nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  summary: z.string().nullable(),
  cluster_id: z.string().uuid().nullable(),
  is_relevant: z.boolean().nullable(),
  created_at: z.string(),
});

export const clusterSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  representative_title: z.string(),
  summary: z.string().nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),
  is_critical: z.boolean(),
  article_count: z.number(),
  is_relevant: z.boolean().nullable(),
  created_at: z.string(),
});

export const strategySchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  platform_id: z.string(),
  strategy_positive: z.string().nullable(),
  strategy_negative: z.string().nullable(),
  created_at: z.string(),
});

export const crawlStatusEnum = z.enum(['crawling', 'analyzing', 'clustering', 'done', 'failed']);
export const crawlFailedAtEnum = z.enum(['crawling', 'analyzing', 'clustering']);

export const crawlSessionSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  total_items: z.number(),
  sir_score: z.number().nullable(),
  created_at: z.string(),
  status: crawlStatusEnum,
  failed_at: crawlFailedAtEnum.nullable(),
});

export type CrawlItem = z.infer<typeof crawlItemSchema>;
export type Cluster = z.infer<typeof clusterSchema>;
export type Strategy = z.infer<typeof strategySchema>;
export type CrawlSession = z.infer<typeof crawlSessionSchema>;
export type CrawlStatus = z.infer<typeof crawlStatusEnum>;
export type CrawlFailedAt = z.infer<typeof crawlFailedAtEnum>;

import { z } from 'zod';

// ── sessions 테이블 ──

export const crawlStatusEnum = z.enum(['crawling', 'analyzing', 'clustering', 'done', 'failed']);
export const crawlFailedAtEnum = z.enum(['crawling', 'analyzing', 'clustering']);

export const sessionSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  report_id: z.string().uuid().nullable(),
  platform_id: z.string().nullable(),
  total_items: z.number(),
  sir_score: z.number().nullable(),
  mood: z.string().nullable(),
  status: crawlStatusEnum,
  failed_at: crawlFailedAtEnum.nullable(),
  failed_reason: z.string().nullable(),
  created_at: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;
export type CrawlStatus = z.infer<typeof crawlStatusEnum>;
export type CrawlFailedAt = z.infer<typeof crawlFailedAtEnum>;

/** @deprecated CrawlSession → Session으로 변경됨 */
export type CrawlSession = Session;

import { z } from 'zod';
import { sentimentEnum } from '@/types/common';

// ── news_items 테이블 ──

export const newsItemSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  session_id: z.string().uuid(),
  platform_id: z.string(),
  title: z.string(),
  link: z.string(),
  content: z.string().nullable(),
  source: z.string().nullable(),
  summary: z.string().nullable(),
  published_at: z.string().nullable(),
  sentiment: sentimentEnum.nullable(),
  critical_type: z.string().nullable(),
  is_relevant: z.boolean().nullable(),
  cluster_id: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type NewsItem = z.infer<typeof newsItemSchema>;

// ── news_clusters 테이블 ──

export const newsClusterSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  session_id: z.string().uuid(),
  representative_title: z.string(),
  summary: z.string().nullable(),
  sentiment: sentimentEnum.nullable(),
  article_count: z.number(),
  is_relevant: z.boolean().nullable(),
  created_at: z.string(),
});

export type NewsCluster = z.infer<typeof newsClusterSchema>;

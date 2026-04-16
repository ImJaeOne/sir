import { z } from 'zod';
import { sentimentEnum, criticalTypeEnum } from '@/types/common';

// ── community_items 테이블 ──

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
  sentiment: sentimentEnum.nullable(),
  critical_type: criticalTypeEnum.nullable(),
  is_cleanbot: z.boolean(),
  is_relevant: z.boolean().nullable(),
  critical_reason: z.string().nullable(),
  created_at: z.string(),
});

export type CommunityItem = z.infer<typeof communityItemSchema>;

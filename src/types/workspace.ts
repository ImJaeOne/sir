import { z } from 'zod';

export const dateRangeSchema = z.object({
  start: z.string(), // YYYY-MM-DD
  end: z.string(),
});

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  auth_id: z.string().uuid(),
  company_name: z.string(),
  ticker: z.string(),
  keywords: z.array(z.string()),
  created_at: z.string(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  company_name: z.string().min(1),
  ticker: z.string().min(1),
  keywords: z.array(z.string()).optional().default([]),
  platform_ids: z.array(z.string()).min(1),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;

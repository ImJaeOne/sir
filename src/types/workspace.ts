import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string(),
  ticker: z.string(),
  sir_score: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const workspaceProfileSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  industry: z.string().nullable(),
  business_summary: z.string().nullable(),
  updated_at: z.string(),
});

export const createWorkspaceSchema = z.object({
  company_name: z.string().min(1),
  ticker: z.string().min(1),
  profile: z.object({
    industry: z.string().optional(),
    business_summary: z.string().optional(),
  }).optional(),
});

export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceProfile = z.infer<typeof workspaceProfileSchema>;
export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;

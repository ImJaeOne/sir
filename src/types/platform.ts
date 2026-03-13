import { z } from 'zod';

export const platformSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const workspacePlatformSchema = z.object({
  workspace_id: z.string().uuid(),
  platform_id: z.string(),
});

export type Platform = z.infer<typeof platformSchema>;
export type WorkspacePlatform = z.infer<typeof workspacePlatformSchema>;

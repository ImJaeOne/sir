export interface Platform {
  id: string;
  label: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkspacePlatform {
  workspace_id: string;
  platform_id: string;
}

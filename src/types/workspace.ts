export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface Workspace {
  id: string;
  name: string;
  auth_id: string;
  company_name: string;
  ticker: string;
  keywords: string[];
  created_at: string;
}

export interface CreateWorkspaceDto {
  name: string;
  company_name: string;
  ticker: string;
  keywords?: string[];
  platform_ids: string[];
}

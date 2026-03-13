export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface Workspace {
  id: string;
  name: string;
  keywords: string[];
  dateRange: DateRange;
  createdAt: string;
}

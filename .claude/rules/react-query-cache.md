# React Query Cache Strategy Guidelines — Report Pages

## Core Principle

> **"The goal is not to split query keys. The goal is to maximize cache hit rate."**

Report pages are dominated by a pattern where data fetched once is **reused** across multiple sections, charts, and tables.
Over-granular query keys cause duplicate fetches of identical data and fragment the cache, making performance worse — not better.

---

## 1. Query Key Design Rules

### ❌ Anti-pattern: Splitting query keys per component

```ts
// Same API call with different query keys → cache miss, duplicate requests
useQuery({ queryKey: ['report', 'summary-chart'], queryFn: () => fetchReport(params) });
useQuery({ queryKey: ['report', 'detail-table'], queryFn: () => fetchReport(params) });
useQuery({ queryKey: ['report', 'kpi-cards'], queryFn: () => fetchReport(params) });
```

### ✅ Correct pattern: Unify keys by data source (API endpoint + parameters)

```ts
// One query fetches the data; each component extracts what it needs via select
const reportQueryOptions = (params: ReportParams) => ({
  queryKey: ['report', params] as const,
  queryFn: () => fetchReport(params),
  staleTime: 5 * 60 * 1000, // report data stays fresh for 5 min
});

// Component A
useQuery({
  ...reportQueryOptions(params),
  select: (data) => data.summary,
});

// Component B
useQuery({
  ...reportQueryOptions(params),
  select: (data) => data.details,
});

// Component C
useQuery({
  ...reportQueryOptions(params),
  select: (data) => data.kpis,
});
```

**Why?** When multiple components share the same `queryKey`, React Query internally executes **only one fetch** and serves the same cached data to all subscribers. `select` transforms data at the component level without touching the cache.

---

## 2. When Splitting Query Keys IS Justified

Split query keys ONLY when **at least one** of these conditions is true:

| Condition                                   | Example                                          |
| ------------------------------------------- | ------------------------------------------------ |
| **Different API endpoint**                  | `/api/report/summary` vs `/api/report/audit-log` |
| **Different request parameters**            | Different date range, different filters          |
| **Fundamentally different refresh cadence** | Real-time KPI vs monthly report                  |
| **Independent error handling required**     | One failure shouldn't block the rest             |

If none of the above apply, **always consolidate into a single query key**.

---

## 3. Recommended Architecture for Report Pages

### 3-1. queryOptions Factory Pattern (Required)

```ts
// queries/report.ts
import { queryOptions } from '@tanstack/react-query';

export const reportQueries = {
  all: () => ['report'] as const,

  // Main report data — fetched as one bulk response
  data: (params: ReportParams) =>
    queryOptions({
      queryKey: [...reportQueries.all(), 'data', params],
      queryFn: () => api.getReportData(params),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    }),

  // Separate endpoint → separation is justified
  auditLog: (reportId: string) =>
    queryOptions({
      queryKey: [...reportQueries.all(), 'audit-log', reportId],
      queryFn: () => api.getAuditLog(reportId),
      staleTime: 60 * 1000,
    }),
};
```

### 3-2. Page-level Prefetch (Optional but strongly recommended)

```ts
// Router loader or top of page component
export async function reportPageLoader({ params }: LoaderArgs) {
  const reportParams = buildReportParams(params);

  // Single fetch on page entry → all child components get cache hits
  await queryClient.ensureQueryData(reportQueries.data(reportParams));

  return { reportParams };
}
```

### 3-3. Child Components Consume via select

```tsx
function KPICards({ params }: { params: ReportParams }) {
  const { data: kpis } = useQuery({
    ...reportQueries.data(params),
    select: (data) => ({
      totalRevenue: data.totalRevenue,
      userCount: data.userCount,
      conversionRate: data.conversionRate,
    }),
  });

  return <Cards items={kpis} />;
}

function RevenueChart({ params }: { params: ReportParams }) {
  const { data: chartData } = useQuery({
    ...reportQueries.data(params),
    select: (data) => data.revenueByMonth,
  });

  return <LineChart data={chartData} />;
}
```

---

## 4. staleTime / gcTime Presets

Choose based on the nature of the report data:

```ts
const CACHE_PRESETS = {
  // Real-time dashboard (refreshes every 30s)
  realtime: { staleTime: 0, refetchInterval: 30_000 },

  // Standard report (refreshes only on explicit user action)
  standard: { staleTime: 5 * 60_000, gcTime: 30 * 60_000 },

  // Historical / finalized data (rarely changes)
  historical: { staleTime: 60 * 60_000, gcTime: 24 * 60 * 60_000 },
} as const;
```

**Decision heuristic:** "Would the user care if this data is 5 minutes old?" → If no, use `standard` or above.

---

## 5. Common Mistakes Checklist

### ✅ Verify on every new query

- [ ] Are there 2+ `useQuery` calls hitting the same API? → Consolidate query key + use `select`
- [ ] Does the `queryKey` contain a component name or UI location info? → Remove it. Keys should express **data identity** only
- [ ] Is `staleTime` left at default (0)? → Default 0 means refetch on every tab focus. Reports almost always need an explicit value
- [ ] Using `enabled: false` in one place and `enabled: true` with the same key elsewhere? → Watch for unintended refetches
- [ ] Using `placeholderData` when filters change? → Improves UX during transitions

### ✅ Smooth filter transitions with placeholderData

```ts
import { keepPreviousData } from '@tanstack/react-query';

useQuery({
  ...reportQueries.data(params),
  placeholderData: keepPreviousData, // Keep previous data visible while new data loads
});
```

---

## 6. Decision Flowchart

```
A new component needs server data
  │
  ├─ Is there already a query calling the same API with the same params?
  │   ├─ YES → Import the same queryOptions, use a different `select`
  │   └─ NO ↓
  │
  ├─ Is the API endpoint different?
  │   ├─ YES → Create a new query key (justified split)
  │   └─ NO ↓
  │
  ├─ Are only the parameters different?
  │   ├─ YES → Use the same factory function with different params
  │   └─ NO → Reuse the existing query
  │
  └─ Is the refresh cadence fundamentally different?
      ├─ YES → Split, but document the reason in a comment
      └─ NO → Consolidate
```

---

## 7. Hard Rules (Never violate these)

1. **Never put `Math.random()`, `Date.now()`, or any value that changes per render into a `queryKey`.**
   → Every render creates a new cache entry and the existing cache is never hit.

2. **Never assume React Query will deduplicate two `useQuery` calls "automatically."**
   → Dedup only works when queryKeys are referentially identical. If identity breaks, they become separate requests.

3. **Never copy report data into global state (Zustand, Redux, etc.).**
   → React Query's cache IS your global state. Copying creates sync bugs.

4. **Never spam `queryClient.invalidateQueries()`.**
   → On report pages, careless invalidation triggers full refetches of everything. Invalidate only the data that actually changed.

---

## One-line Summary

> **One API response = one query key. Per-component differences are handled by `select`. Before splitting a query key, ask: "Is this actually different data?"**

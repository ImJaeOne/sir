'use client';

import { EmptyState } from '@/components/ui/EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey: (item: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = '데이터가 없습니다.',
  rowKey,
}: DataTableProps<T>) {
  if (data.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <table className="w-full text-sm table-fixed">
      <colgroup>
        {columns.map((col) => (
          <col key={col.key} style={col.width ? { width: col.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr className="border-y border-border-light">
          {columns.map((col) => (
            <th
              key={col.key}
              className="py-3 px-3 text-xs font-semibold text-text-muted text-center"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr
            key={rowKey(item, i)}
            className="border-b border-border-light last:border-0 hover:bg-slate-50/50 transition-colors"
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`py-4 px-3 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                }`}
              >
                {col.render(item, i)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

'use client';

import { useMemo } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useReportInfo } from '@/hooks/report/useReportQuery';
import { getClientReportSections } from '@/components/client/sidebar/sections';

interface SidebarSectionNavProps {
  isOpen: boolean;
}

export function SidebarSectionNav({ isOpen }: SidebarSectionNavProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reportId = (params?.reportId as string | undefined) ?? '';
  const { data: report } = useReportInfo(reportId);
  const isDaily = report?.type === 'daily';

  const sections = useMemo(() => getClientReportSections(isDaily), [isDaily]);
  const activeId = searchParams?.get('section') ?? sections[0]?.id;

  const handleClick = (id: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    next.set('section', id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
      {sections.map(({ id, label, Icon }) => {
        const active = activeId === id;
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`flex items-center gap-2.5 rounded-lg transition-colors cursor-pointer ${isOpen ? 'px-9 py-4' : 'py-2.5 justify-center'} ${active ? 'bg-bg-accent' : isOpen ? 'bg-bg-light' : ''}`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Icon size={20} color={active ? 'white' : '#828EA6'} />
            </div>
            {isOpen && (
              <span
                className={`text-sm font-medium whitespace-nowrap ${active ? 'text-white' : 'text-text-muted'}`}
              >
                {label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

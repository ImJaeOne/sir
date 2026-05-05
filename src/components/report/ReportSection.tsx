import { useRef, useState, useEffect } from 'react';

export function ReportSection({
  id,
  icon,
  title,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      threshold: 1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} className="flex flex-col gap-2 lg:gap-6">
      <div ref={sentinelRef} className="h-0 -mt-2 lg:hidden" />
      <div
        className={`sticky top-0 lg:static z-10 py-3 -mx-4 px-4 lg:mx-0 lg:px-0 lg:py-0 flex items-center gap-2.5 ${
          stuck ? 'bg-white/70 backdrop-blur-md' : 'bg-transparent'
        } lg:bg-transparent lg:backdrop-blur-none`}
      >
        {icon}
        <h2 className="text-lg lg:text-2xl font-semibold text-text-dark shrink-0">{title}</h2>
      </div>
      <div className="flex flex-col gap-10">{children}</div>
    </section>
  );
}

import { Tooltip } from '@/components/ui/Tooltip';

export function ReportSubSection({
  title,
  description,
  tooltip,
  tooltipVariant = 'default',
  className,
  action,
  children,
}: {
  title: string;
  description?: string;
  tooltip?: string;
  tooltipVariant?: 'default' | 'danger';
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold text-text-accent">{title}</h3>
          {tooltip && <Tooltip text={tooltip} variant={tooltipVariant} />}
          {action && <div className="ml-auto">{action}</div>}
        </div>
        {description && (
          <p className="text-xs lg:text-sm font-normal text-text-muted">{description}</p>
        )}
      </div>
      <div className={className ?? ''}>{children}</div>
    </div>
  );
}

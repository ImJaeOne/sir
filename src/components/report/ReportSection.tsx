export function ReportSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-xl font-bold text-text-dark shrink-0">{title}</h2>
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
  width,
  className,
  children,
}: {
  title: string;
  description?: string;
  tooltip?: string;
  width?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold text-text-accent">{title}</h3>
          {tooltip && <Tooltip text={tooltip} width={width} />}
        </div>
        {description && <p className="text-sm font-normal text-text-muted">{description}</p>}
      </div>
      <div className={`${className}`}>{children}</div>
    </div>
  );
}

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
    <section className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-[28px] font-bold text-text-dark shrink-0">{title}</h2>
      </div>
      <div className="flex flex-col gap-15">{children}</div>
    </section>
  );
}

export function ReportSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-text-accent">{title}</h3>
      {children}
    </div>
  );
}

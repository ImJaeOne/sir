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

export function ReportSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold text-text-accent">{title}</h3>
      {children}
    </div>
  );
}

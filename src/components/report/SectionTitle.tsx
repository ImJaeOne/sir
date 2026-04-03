export function SectionTitle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-text-accent">{title}</h3>
      {children}
    </div>
  );
}

interface LegendItem {
  color: string;
  secondColor?: string;
  label: string;
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex items-center gap-3 text-xs text-text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.secondColor ? (
            <span className="w-2.5 h-2.5 rounded-full overflow-hidden flex">
              <span className={`w-1/2 h-full ${item.color}`} />
              <span className={`w-1/2 h-full ${item.secondColor}`} />
            </span>
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}

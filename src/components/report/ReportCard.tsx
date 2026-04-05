interface ReportCardProps {
  children: React.ReactNode;
  className?: string;
  px?: number;
  py?: number;
}

export function ReportCard({ children, className, px, py }: ReportCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card ${className}`}
      style={px || py ? { padding: `${py ?? 0}px ${px ?? 0}px` } : undefined}
    >
      {children}
    </div>
  );
}

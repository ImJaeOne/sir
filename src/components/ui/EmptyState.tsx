export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-xs text-text-muted whitespace-pre-line text-center">{message}</p>
    </div>
  );
}

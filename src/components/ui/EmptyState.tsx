export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-sm text-slate-400 whitespace-pre-line text-center">{message}</p>
    </div>
  );
}

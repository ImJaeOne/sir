export function TierStack({ score }: { score: number }) {
  const tierIdx = Math.min(Math.floor(score / 100), 9);
  const tiers = Array.from({ length: 10 }, (_, i) => 9 - i);

  return (
    <div className="flex flex-col w-[60px] items-center gap-[2px]">
      {tiers.map((t) => (
        <div
          key={t}
          className="h-[4px] w-[36px] rounded-full transition-colors"
          style={{
            background: t === tierIdx ? 'linear-gradient(to right, #66B6FF, #362CFF)' : '#e2e8f0',
          }}
        />
      ))}
    </div>
  );
}

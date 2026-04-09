interface LoadingProps {
  text?: string;
  overlay?: boolean;
}

function BouncingDots() {
  return (
    <>
      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
      `}</style>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-bg-accent"
            style={{
              animation: 'dot-bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/** 전체 화면 로딩 (Suspense fallback 등) */
export function Loading({ text = '로딩 중' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-49px)] gap-4">
      <BouncingDots />
      <p className="text-sm text-text-dark">{text}</p>
    </div>
  );
}

/** 오버레이 로딩 (다운로드 등 블로킹 작업) */
export function LoadingOverlay({ text = '로딩 중' }: LoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/60 backdrop-blur-[2px]">
      <BouncingDots />
      <p className="text-sm text-text-dark">{text}</p>
    </div>
  );
}

interface AdminLoadingProps {
  message?: string;
  className?: string;
}

const DEFAULT_MESSAGE = '불러오는 중';

export function AdminLoading({ message = DEFAULT_MESSAGE, className = '' }: AdminLoadingProps) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-5 p-4 ${className}`}>
      <style>{`
        @keyframes admin-loading-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes admin-loading-dot {
          0%, 80%, 100% { opacity: 0.25; }
          40% { opacity: 1; }
        }
      `}</style>
      <div className="relative w-44 h-[2px] bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-slate-400 to-transparent rounded-full"
          style={{ animation: 'admin-loading-progress 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        />
      </div>
      <div className="flex items-center">
        <p className="text-sm text-slate-500 tracking-tight">{message}</p>
        <span className="inline-flex gap-px ml-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="text-sm text-slate-400"
              style={{
                animation: 'admin-loading-dot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            >
              .
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

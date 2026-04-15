import { LoadingIcon } from '@/components/icons/LoadingIcon';

interface LoadingProps {
  title?: string;
  subtitle?: string;
}

const DEFAULT_TITLE = '정보를 업데이트 하고 있어요';
const DEFAULT_SUBTITLE = '잠시만 기다려주세요';

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
        {[0, 1, 2].map((i) => (
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

function LoadingContent({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <LoadingIcon width={60} height={50} />
      <div className="flex flex-col items-center gap-1 mb-2">
        <p className="text-base font-semibold text-text-dark">{title}</p>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
      <BouncingDots />
    </div>
  );
}

/** 전체 화면 로딩 (Suspense fallback 등) */
export function Loading({ title = DEFAULT_TITLE, subtitle = DEFAULT_SUBTITLE }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-49px)]">
      <LoadingContent title={title} subtitle={subtitle} />
    </div>
  );
}

/** 오버레이 로딩 (다운로드 등 블로킹 작업) */
export function LoadingOverlay({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}: LoadingProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
      <LoadingContent title={title} subtitle={subtitle} />
    </div>
  );
}

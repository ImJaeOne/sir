interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text }: LoadingSpinnerProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray/30 backdrop-blur-[1px]">
      <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="47 16"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

import type { PipelineStage, StageStatus } from '@/types/pipeline';

interface PipelineStageCardProps {
  stage: PipelineStage;
  index: number;
  status: StageStatus;
  isActive: boolean;
  onStart: () => void;
}

export function PipelineStageCard({
  stage,
  index,
  status,
  isActive,
  onStart,
}: PipelineStageCardProps) {
  const isCompleted = status === 'completed';
  const isLoading = status === 'loading';
  const isLocked = !isActive && status === 'idle';

  return (
    <div
      className={`bg-white rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-200 ${
        isActive
          ? 'border-blue-200 shadow-md'
          : isCompleted
            ? 'border-slate-100 shadow-sm'
            : 'border-slate-100 opacity-40'
      }`}
    >
      {/* Stage header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isCompleted
                ? 'bg-green-100 text-green-700'
                : isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isCompleted ? '✓' : index + 1}
          </div>
          <h3
            className={`font-semibold text-sm ${
              isActive || isCompleted ? 'text-slate-800' : 'text-slate-400'
            }`}
          >
            {stage.label}
          </h3>
        </div>

        {/* Action area */}
        {isActive && !isLoading && (
          <button
            onClick={onStart}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {stage.buttonText}
          </button>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
            <svg
              className="animate-spin w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            처리 중...
          </div>
        )}
        {isCompleted && <span className="text-green-600 text-sm font-medium">완료</span>}
        {isLocked && <span className="text-slate-300 text-sm">대기 중</span>}
      </div>

      {/* Result section */}
      {isCompleted && (
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-700">{stage.result.summary}</p>
          <ul className="flex flex-col gap-1.5">
            {stage.result.items.map((item) => (
              <li key={item} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import type { PipelineStage, StageStatus } from '@/types/pipeline';

interface StagePanelProps {
  stage: PipelineStage;
  status: StageStatus;
  nextStageLabel: string | null;
  onStart: () => void;
  onNext: () => void;
}

export function StagePanel({ stage, status, nextStageLabel, onStart, onNext }: StagePanelProps) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6">
      {/* Stage title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">{stage.label}</h2>
        {status === 'completed' && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            완료
          </span>
        )}
      </div>
      {/* Idle: start button */}
      {status === 'idle' && (
        <button
          onClick={onStart}
          className="self-start bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          {stage.buttonText}
        </button>
      )}
      {/* Loading: loading button */}
      {status === 'loading' && (
        <button className="self-start bg-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer">
          처리 중...
        </button>
      )}
      {/* Completed: result + next button */}
      {status === 'completed' && (
        <>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-700">{stage.result.summary}</p>
            <ul className="flex flex-col gap-2">
              {stage.result.items.map((item) => (
                <li key={item} className="text-sm text-slate-500 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {nextStageLabel ? (
            <button
              onClick={onNext}
              className="self-start bg-slate-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-slate-700 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              → 다음: {nextStageLabel}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
              <span>✅</span>
              <span>모든 단계가 완료되었습니다.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

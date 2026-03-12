import { PIPELINE_STAGES } from '@/constants/pipeline';
import { usePipelineStore } from '@/store/pipeline';

export function StageNav() {
  const { stageStatuses, setCurrentStep, getFrontierIndex } = usePipelineStore();
  const frontierIndex = getFrontierIndex();

  console.log(stageStatuses);

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Step</p>
      {PIPELINE_STAGES.map((stage, index) => {
        const isCompleted = stageStatuses[stage.id] === 'completed';
        const isFrontier = index === frontierIndex;
        const isLocked = index > frontierIndex;

        return (
          <button
            key={stage.id}
            onClick={() => setCurrentStep(stage.id)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-colors cursor-pointer ${
              isFrontier
                ? 'bg-blue-50 text-blue-700 font-medium'
                : isCompleted
                  ? 'text-slate-600 hover:bg-slate-50'
                  : isLocked
                    ? 'text-slate-300'
                    : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                isCompleted
                  ? 'bg-green-100 text-green-600'
                  : isFrontier
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            {stage.label}
          </button>
        );
      })}
    </nav>
  );
}

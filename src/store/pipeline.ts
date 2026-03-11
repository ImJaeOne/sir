import { create } from 'zustand';
import type { StageId, StageStatus } from '@/types/pipeline';

export const STAGE_IDS: StageId[] = ['crawling', 'analysis', 'content', 'report', 'email'];

interface PipelineState {
  currentStep: StageId;
  stageStatuses: Record<StageId, StageStatus>;

  setCurrentStep: (id: StageId) => void;
  startStage: (id: StageId) => void;
  completeStage: (id: StageId) => void;
  getFrontierIndex: () => number;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  currentStep: 'crawling',

  stageStatuses: {
    crawling: 'idle',
    analysis: 'idle',
    content: 'idle',
    report: 'idle',
    email: 'idle',
  },

  setCurrentStep: (id) => set({ currentStep: id }),

  startStage: (id) => {
    set((state) => ({
      currentStep: id,
      stageStatuses: { ...state.stageStatuses, [id]: 'loading' },
    }));
  },

  completeStage: (id) => {
    const nextIndex = STAGE_IDS.indexOf(id) + 1;
    const nextStep = nextIndex < STAGE_IDS.length ? STAGE_IDS[nextIndex] : id;

    set((state) => ({
      currentStep: nextStep,
      stageStatuses: { ...state.stageStatuses, [id]: 'completed' },
    }));
  },

  getFrontierIndex: () => {
    const { stageStatuses } = get();
    const idx = STAGE_IDS.findIndex((id) => stageStatuses[id] !== 'completed');
    return idx === -1 ? STAGE_IDS.length : idx;
  },
}));

import { create } from 'zustand';
import type { StageId, StageStatus } from '@/types/pipeline';

export const STAGE_IDS: StageId[] = ['crawling', 'analysis', 'content', 'report', 'email'];

interface PipelineState {
  // stage
  currentStep: StageId;
  stageStatuses: Record<StageId, StageStatus>;

  // selected articles for content creation
  selectedUrls: Set<string>;

  // UI
  dismissedComplete: boolean;
  backModalType: 'delete' | 'confirm' | null;

  // actions
  initFromParams: (step: StageId | null, allCompleted: boolean) => void;
  setCurrentStep: (id: StageId) => void;
  startStage: (id: StageId) => void;
  completeStage: (id: StageId) => void;
  skipStage: (id: StageId) => void;
  toggleUrl: (url: string) => void;
  setDismissedComplete: (v: boolean) => void;
  setBackModalType: (v: 'delete' | 'confirm' | null) => void;
  reset: () => void;

  // derived
  getFrontierIndex: () => number;
  isAllCompleted: () => boolean;
  hasStarted: () => boolean;
  isReportDone: () => boolean;
}

const initialStatuses: Record<StageId, StageStatus> = {
  crawling: 'idle',
  analysis: 'idle',
  content: 'idle',
  report: 'idle',
  email: 'idle',
};

export const usePipelineStore = create<PipelineState>((set, get) => ({
  currentStep: 'crawling',
  stageStatuses: { ...initialStatuses },
  selectedUrls: new Set<string>(),
  dismissedComplete: false,
  backModalType: null,

  initFromParams: (step, allCompleted) => {
    const statuses = { ...initialStatuses };

    if (allCompleted) {
      STAGE_IDS.forEach((id) => {
        statuses[id] = 'completed';
      });
      set({ stageStatuses: statuses, currentStep: 'email' });
      return;
    }

    if (!step || !STAGE_IDS.includes(step)) {
      set({ stageStatuses: statuses, currentStep: 'crawling' });
      return;
    }

    const stepIndex = STAGE_IDS.indexOf(step);
    STAGE_IDS.forEach((id, i) => {
      if (i < stepIndex) statuses[id] = 'completed';
    });
    set({ stageStatuses: statuses, currentStep: step });
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

  skipStage: (id) => {
    set((state) => ({
      stageStatuses: { ...state.stageStatuses, [id]: 'skipped' },
    }));
  },

  toggleUrl: (url) => {
    set((state) => {
      const next = new Set(state.selectedUrls);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return { selectedUrls: next };
    });
  },

  setDismissedComplete: (v) => set({ dismissedComplete: v }),
  setBackModalType: (v) => set({ backModalType: v }),

  reset: () =>
    set({
      currentStep: 'crawling',
      stageStatuses: { ...initialStatuses },
      selectedUrls: new Set<string>(),
      dismissedComplete: false,
      backModalType: null,
    }),

  getFrontierIndex: () => {
    const { stageStatuses } = get();
    const idx = STAGE_IDS.findIndex(
      (id) => stageStatuses[id] !== 'completed' && stageStatuses[id] !== 'skipped'
    );
    return idx === -1 ? STAGE_IDS.length : idx;
  },

  isAllCompleted: () => get().getFrontierIndex() === STAGE_IDS.length,

  hasStarted: () => get().stageStatuses.crawling !== 'idle',

  isReportDone: () => get().stageStatuses.report === 'completed',
}));

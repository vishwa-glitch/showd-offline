import { create } from 'zustand';

interface TimerState {
  // Active timer state (null = no active timer)
  activeTaskId: string | null;
  activeTaskEventId: string | null;
  startedAt: string | null;
  durationSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  pausedAt: string | null;
  totalPausedSeconds: number;
  extensionsUsed: number;
  totalExtensionSeconds: number;

  // Post-timer overlay
  showPostTimerCompletion: boolean;
  completedTaskId: string | null;
  completedDurationSeconds: number;

  // Actions
  startTimer: (taskId: string, taskEventId: string, durationMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  completeTimer: () => void;
  extendTimer: (additionalMinutes: number) => void;
  abandonTimer: () => void;
  showPostTimer: () => void;
  dismissPostTimer: () => void;

  // Reconciliation
  reconcileTimer: () => void;

  // Selectors
  isTimerActive: () => boolean;
  getProgress: () => number;
  getPausedAt: () => string | null;
}

const useTimerStoreBase = create<TimerState>((set, get) => ({
  activeTaskId: null,
  activeTaskEventId: null,
  startedAt: null,
  durationSeconds: 0,
  remainingSeconds: 0,
  isPaused: false,
  pausedAt: null,
  totalPausedSeconds: 0,
  extensionsUsed: 0,
  totalExtensionSeconds: 0,

  showPostTimerCompletion: false,
  completedTaskId: null,
  completedDurationSeconds: 0,

  startTimer: (taskId, taskEventId, durationMinutes) => {
    const { activeTaskId } = get();
    if (activeTaskId) return; // Only one timer at a time
    const durationSeconds = durationMinutes * 60;
    set({
      activeTaskId: taskId,
      activeTaskEventId: taskEventId,
      startedAt: new Date().toISOString(),
      durationSeconds,
      remainingSeconds: durationSeconds,
      isPaused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      extensionsUsed: 0,
      totalExtensionSeconds: 0,
    });
  },

  pauseTimer: () => {
    const { isPaused, activeTaskId } = get();
    if (!activeTaskId || isPaused) return;
    set({ isPaused: true, pausedAt: new Date().toISOString() });
  },

  resumeTimer: () => {
    const { isPaused, pausedAt, totalPausedSeconds, activeTaskId } = get();
    if (!activeTaskId || !isPaused || !pausedAt) return;
    const pausedDuration = Math.floor(
      (Date.now() - new Date(pausedAt).getTime()) / 1000
    );
    set({
      isPaused: false,
      pausedAt: null,
      totalPausedSeconds: totalPausedSeconds + pausedDuration,
    });
  },

  tickTimer: () => {
    const { remainingSeconds, isPaused, activeTaskId } = get();
    if (!activeTaskId || isPaused) return;

    if (remainingSeconds <= 1) {
      // Timer reached zero — show post-timer completion
      set({
        remainingSeconds: 0,
        showPostTimerCompletion: true,
        completedTaskId: activeTaskId,
        completedDurationSeconds: get().durationSeconds,
      });
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  completeTimer: () => {
    set({
      activeTaskId: null,
      activeTaskEventId: null,
      startedAt: null,
      durationSeconds: 0,
      remainingSeconds: 0,
      isPaused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      extensionsUsed: 0,
      totalExtensionSeconds: 0,
      showPostTimerCompletion: false,
      completedTaskId: null,
      completedDurationSeconds: 0,
    });
  },

  extendTimer: (additionalMinutes) => {
    const { extensionsUsed, totalExtensionSeconds, durationSeconds } = get();
    const additionalSeconds = additionalMinutes * 60;
    set({
      remainingSeconds: additionalSeconds,
      durationSeconds: durationSeconds + additionalSeconds,
      extensionsUsed: extensionsUsed + 1,
      totalExtensionSeconds: totalExtensionSeconds + additionalSeconds,
      showPostTimerCompletion: false,
      completedTaskId: null,
      completedDurationSeconds: 0,
    });
  },

  abandonTimer: () => {
    set({
      activeTaskId: null,
      activeTaskEventId: null,
      startedAt: null,
      durationSeconds: 0,
      remainingSeconds: 0,
      isPaused: false,
      pausedAt: null,
      totalPausedSeconds: 0,
      extensionsUsed: 0,
      totalExtensionSeconds: 0,
      showPostTimerCompletion: false,
      completedTaskId: null,
      completedDurationSeconds: 0,
    });
  },

  showPostTimer: () => {
    const { activeTaskId, durationSeconds } = get();
    set({
      showPostTimerCompletion: true,
      completedTaskId: activeTaskId,
      completedDurationSeconds: durationSeconds,
    });
  },

  dismissPostTimer: () => {
    set({
      showPostTimerCompletion: false,
      completedTaskId: null,
      completedDurationSeconds: 0,
    });
  },

  reconcileTimer: () => {
    const { activeTaskId, startedAt, durationSeconds, isPaused, pausedAt, totalPausedSeconds } = get();
    if (!activeTaskId || !startedAt || isPaused) return;

    const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) - totalPausedSeconds;
    const newRemaining = Math.max(0, durationSeconds - elapsedSeconds);

    if (newRemaining <= 0) {
      // Timer completed while in background
      set({
        remainingSeconds: 0,
        showPostTimerCompletion: true,
        completedTaskId: activeTaskId,
        completedDurationSeconds: durationSeconds,
      });
    } else {
      set({ remainingSeconds: newRemaining });
    }
  },

  isTimerActive: () => get().activeTaskId !== null,
  getProgress: () => {
    const { durationSeconds, remainingSeconds } = get();
    if (durationSeconds === 0) return 0;
    return Math.max(0, Math.min(1, 1 - remainingSeconds / durationSeconds));
  },
  getPausedAt: () => get().pausedAt,
}));

// Individual hook exports (following reminderStore pattern)
export const useActiveTimerTaskId = () => useTimerStoreBase((s) => s.activeTaskId);
export const useActiveTimerEventId = () => useTimerStoreBase((s) => s.activeTaskEventId);
export const useTimerStartedAt = () => useTimerStoreBase((s) => s.startedAt);
export const useTimerDurationSeconds = () => useTimerStoreBase((s) => s.durationSeconds);
export const useTimerRemainingSeconds = () => useTimerStoreBase((s) => s.remainingSeconds);
export const useTimerIsPaused = () => useTimerStoreBase((s) => s.isPaused);
export const useTimerPausedAt = () => useTimerStoreBase((s) => s.pausedAt);
export const useTimerTotalPausedSeconds = () => useTimerStoreBase((s) => s.totalPausedSeconds);
export const useTimerExtensionsUsed = () => useTimerStoreBase((s) => s.extensionsUsed);
export const useTimerTotalExtensionSeconds = () => useTimerStoreBase((s) => s.totalExtensionSeconds);
export const useShowPostTimerCompletion = () => useTimerStoreBase((s) => s.showPostTimerCompletion);
export const useCompletedTimerTaskId = () => useTimerStoreBase((s) => s.completedTaskId);
export const useCompletedDurationSeconds = () => useTimerStoreBase((s) => s.completedDurationSeconds);
export const useIsTimerActive = () => useTimerStoreBase((s) => s.isTimerActive());
export const useTimerProgress = () => useTimerStoreBase((s) => s.getProgress());

export const useStartTimer = () => useTimerStoreBase((s) => s.startTimer);
export const usePauseTimer = () => useTimerStoreBase((s) => s.pauseTimer);
export const useResumeTimer = () => useTimerStoreBase((s) => s.resumeTimer);
export const useTickTimer = () => useTimerStoreBase((s) => s.tickTimer);
export const useCompleteTimer = () => useTimerStoreBase((s) => s.completeTimer);
export const useExtendTimer = () => useTimerStoreBase((s) => s.extendTimer);
export const useAbandonTimer = () => useTimerStoreBase((s) => s.abandonTimer);
export const useShowPostTimer = () => useTimerStoreBase((s) => s.showPostTimer);
export const useDismissPostTimer = () => useTimerStoreBase((s) => s.dismissPostTimer);
export const useReconcileTimer = () => useTimerStoreBase((s) => s.reconcileTimer);
export const useGetTimerPausedAt = () => useTimerStoreBase((s) => s.getPausedAt);

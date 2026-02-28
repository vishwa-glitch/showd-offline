import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface ReminderState {
  pendingReminders: string[];
  activeTaskId: string | null;
  snoozeCounts: Record<string, number>;
  showStrugglingSheet: boolean;
  showSuccessAnimation: boolean;
  completedStreak: number | null;

  triggerReminder: (taskId: string) => void;
  dismissReminder: () => void;
  snoozeReminder: (taskId: string) => void;
  openStrugglingSheet: () => void;
  closeStrugglingSheet: () => void;
  showSuccess: (streak?: number) => void;
  hideSuccess: () => void;
  getSnoozeCount: (taskId: string) => number;
  resetSnoozeCounts: () => void;
}

const useReminderStoreBase = create<ReminderState>((set, get) => ({
  pendingReminders: [],
  activeTaskId: null,
  snoozeCounts: {},
  showStrugglingSheet: false,
  showSuccessAnimation: false,
  completedStreak: null,

  triggerReminder: (taskId) => {
    console.log('[reminderStore] triggerReminder called with taskId:', taskId);
    const { activeTaskId, pendingReminders } = get();
    console.log('[reminderStore] Current state - activeTaskId:', activeTaskId, 'pendingReminders:', pendingReminders);

    // Deduplicate the same task. Notification events can arrive more than once.
    if (activeTaskId === taskId || pendingReminders.includes(taskId)) {
      console.log('[reminderStore] Duplicate reminder ignored for task:', taskId);
      return;
    }

    if (activeTaskId) {
      // Already showing a different reminder, queue this one.
      console.log('[reminderStore] Queueing reminder for task:', taskId);
      set({ pendingReminders: [...pendingReminders, taskId] });
    } else {
      console.log('[reminderStore] Setting activeTaskId to:', taskId);
      set({ activeTaskId: taskId });
    }
  },

  dismissReminder: () => {
    const { pendingReminders } = get();
    if (pendingReminders.length > 0) {
      // Show next queued reminder
      const [next, ...rest] = pendingReminders;
      set({ activeTaskId: next, pendingReminders: rest, showStrugglingSheet: false });
    } else {
      set({ activeTaskId: null, showStrugglingSheet: false });
    }
  },

  snoozeReminder: (taskId) => {
    const { snoozeCounts } = get();
    const current = snoozeCounts[taskId] || 0;
    set({
      snoozeCounts: { ...snoozeCounts, [taskId]: current + 1 },
    });
    get().dismissReminder();
  },

  openStrugglingSheet: () => set({ showStrugglingSheet: true }),
  closeStrugglingSheet: () => set({ showStrugglingSheet: false }),

  showSuccess: (streak) =>
    set({ showSuccessAnimation: true, completedStreak: streak || null }),
  hideSuccess: () =>
    set({ showSuccessAnimation: false, completedStreak: null }),

  getSnoozeCount: (taskId) => get().snoozeCounts[taskId] || 0,

  resetSnoozeCounts: () => set({ snoozeCounts: {} }),
}));

// Individual hook exports
export const useActiveTaskId = () => useReminderStoreBase((s) => s.activeTaskId);
export const usePendingReminders = () => useReminderStoreBase(useShallow((s) => s.pendingReminders));
export const useSnoozeCounts = () => useReminderStoreBase(useShallow((s) => s.snoozeCounts));
export const useShowStrugglingSheet = () => useReminderStoreBase((s) => s.showStrugglingSheet);
export const useShowSuccessAnimation = () => useReminderStoreBase((s) => s.showSuccessAnimation);
export const useCompletedStreak = () => useReminderStoreBase((s) => s.completedStreak);
export const useTriggerReminder = () => useReminderStoreBase((s) => s.triggerReminder);
export const useDismissReminder = () => useReminderStoreBase((s) => s.dismissReminder);
export const useSnoozeReminder = () => useReminderStoreBase((s) => s.snoozeReminder);
export const useOpenStrugglingSheet = () => useReminderStoreBase((s) => s.openStrugglingSheet);
export const useCloseStrugglingSheet = () => useReminderStoreBase((s) => s.closeStrugglingSheet);
export const useShowSuccess = () => useReminderStoreBase((s) => s.showSuccess);
export const useHideSuccess = () => useReminderStoreBase((s) => s.hideSuccess);
export const useGetSnoozeCount = () => useReminderStoreBase((s) => s.getSnoozeCount);
export const useResetSnoozeCounts = () => useReminderStoreBase((s) => s.resetSnoozeCounts);

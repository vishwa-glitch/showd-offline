import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RatingTriggerResult {
  shouldShow: boolean;
  trigger: 'streak_3' | 'streak_7' | 'streak_14' | 'task_10' | 'struggle_then_complete' | null;
  streakCount?: number;
  taskCount?: number;
}

interface RatingState {
  totalCompletedTasks: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hasStruggleThenCompletedToday: boolean;
  appOpenCount: number;
  struggledToday: boolean;

  lastRatingPromptDate: string | null;
  hasRatedApp: boolean;
  ratingPromptCount: number;

  recordAppOpen: () => void;
  recordTaskCompletion: () => void;
  recordStruggle: () => void;
  shouldShowRatingPrompt: () => RatingTriggerResult;
  markRatingPromptShown: () => void;
  markAppRated: () => void;
}

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

const useRatingStoreBase = create<RatingState>()(
  persist(
    (set, get) => ({
      totalCompletedTasks: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      hasStruggleThenCompletedToday: false,
      appOpenCount: 0,
      struggledToday: false,

      lastRatingPromptDate: null,
      hasRatedApp: false,
      ratingPromptCount: 0,

      recordAppOpen: () => {
        const today = getToday();
        const { lastActiveDate } = get();
        // Reset daily flags if it's a new day
        if (lastActiveDate !== today) {
          set((state) => ({
            appOpenCount: state.appOpenCount + 1,
            struggledToday: false,
            hasStruggleThenCompletedToday: false,
          }));
        } else {
          set((state) => ({ appOpenCount: state.appOpenCount + 1 }));
        }
      },

      recordTaskCompletion: () => {
        const today = getToday();
        const yesterday = getYesterday();
        const { lastActiveDate, currentStreak, struggledToday } = get();

        let newStreak = currentStreak;
        if (lastActiveDate !== today) {
          newStreak = lastActiveDate === yesterday ? currentStreak + 1 : 1;
        }

        set((state) => ({
          totalCompletedTasks: state.totalCompletedTasks + 1,
          currentStreak: newStreak,
          longestStreak: Math.max(state.longestStreak, newStreak),
          lastActiveDate: today,
          hasStruggleThenCompletedToday: struggledToday ? true : state.hasStruggleThenCompletedToday,
        }));
      },

      recordStruggle: () => {
        set({ struggledToday: true });
      },

      shouldShowRatingPrompt: (): RatingTriggerResult => {
        const {
          hasRatedApp,
          appOpenCount,
          lastRatingPromptDate,
          currentStreak,
          totalCompletedTasks,
          hasStruggleThenCompletedToday,
        } = get();

        if (hasRatedApp) return { shouldShow: false, trigger: null };
        if (appOpenCount <= 2) return { shouldShow: false, trigger: null };

        if (lastRatingPromptDate) {
          const elapsed = Date.now() - new Date(lastRatingPromptDate).getTime();
          if (elapsed < FIVE_DAYS_MS) return { shouldShow: false, trigger: null };
        }

        // Priority 1: Streak milestones
        if (currentStreak === 3 || currentStreak === 7 || currentStreak === 14) {
          return {
            shouldShow: true,
            trigger: `streak_${currentStreak}` as RatingTriggerResult['trigger'],
            streakCount: currentStreak,
          };
        }

        // Priority 2: 10th completed task
        if (totalCompletedTasks === 10) {
          return {
            shouldShow: true,
            trigger: 'task_10',
            taskCount: totalCompletedTasks,
          };
        }

        // Priority 3: Struggled then completed
        if (hasStruggleThenCompletedToday) {
          return { shouldShow: true, trigger: 'struggle_then_complete' };
        }

        return { shouldShow: false, trigger: null };
      },

      markRatingPromptShown: () =>
        set((state) => ({
          lastRatingPromptDate: new Date().toISOString(),
          ratingPromptCount: state.ratingPromptCount + 1,
        })),

      markAppRated: () => set({ hasRatedApp: true }),
    }),
    {
      name: 'showd-rating',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        totalCompletedTasks: state.totalCompletedTasks,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate,
        appOpenCount: state.appOpenCount,
        lastRatingPromptDate: state.lastRatingPromptDate,
        hasRatedApp: state.hasRatedApp,
        ratingPromptCount: state.ratingPromptCount,
      }),
    },
  ),
);

export { useRatingStoreBase };

export const useRecordAppOpen = () => useRatingStoreBase((s) => s.recordAppOpen);
export const useRecordTaskCompletion = () => useRatingStoreBase((s) => s.recordTaskCompletion);
export const useRecordStruggle = () => useRatingStoreBase((s) => s.recordStruggle);
export const useShouldShowRatingPrompt = () => useRatingStoreBase((s) => s.shouldShowRatingPrompt);
export const useMarkRatingPromptShown = () => useRatingStoreBase((s) => s.markRatingPromptShown);
export const useMarkAppRated = () => useRatingStoreBase((s) => s.markAppRated);
export const useHasRatedApp = () => useRatingStoreBase((s) => s.hasRatedApp);

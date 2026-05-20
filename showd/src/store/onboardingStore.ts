import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DismissAction, NagInterval } from '../types/task';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  userName: string;
  defaultSnoozeLimit: number;
  defaultDismissAction: DismissAction;
  defaultNagInterval: NagInterval;
  defaultWeeklyGoal: number;

  completeOnboarding: () => void;
  updateName: (name: string) => void;
  updateDefaultSnoozeLimit: (limit: number) => void;
  updateDefaultDismissAction: (action: DismissAction) => void;
  updateDefaultNagInterval: (interval: NagInterval) => void;
  updateDefaultWeeklyGoal: (goal: number) => void;
}

const useOnboardingStoreBase = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userName: '',
      defaultSnoozeLimit: 3,
      defaultDismissAction: 'swipe' as DismissAction,
      defaultNagInterval: 'off' as NagInterval,
      defaultWeeklyGoal: 5,

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      updateName: (name: string) => set({ userName: name }),

      updateDefaultSnoozeLimit: (limit: number) => set({ defaultSnoozeLimit: limit }),

      updateDefaultDismissAction: (action: DismissAction) => set({ defaultDismissAction: action }),

      updateDefaultNagInterval: (interval: NagInterval) => set({ defaultNagInterval: interval }),

      updateDefaultWeeklyGoal: (goal: number) => {
        const clamped = Math.max(1, Math.min(7, Math.round(goal)));
        set({ defaultWeeklyGoal: clamped });
      },
    }),
    {
      name: 'showd-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<OnboardingState>;
        if (version < 1) {
          return {
            hasCompletedOnboarding: state.hasCompletedOnboarding ?? false,
            userName: state.userName ?? '',
            defaultSnoozeLimit: state.defaultSnoozeLimit ?? 3,
            defaultDismissAction: 'swipe' as DismissAction,
            defaultNagInterval: 'off' as NagInterval,
            defaultWeeklyGoal: 5,
          };
        }
        return state;
      },
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userName: state.userName,
        defaultSnoozeLimit: state.defaultSnoozeLimit,
        defaultDismissAction: state.defaultDismissAction,
        defaultNagInterval: state.defaultNagInterval,
        defaultWeeklyGoal: state.defaultWeeklyGoal,
      }),
    },
  ),
);

export const useOnboardingStore = useOnboardingStoreBase;

export const useHasCompletedOnboarding = () =>
  useOnboardingStoreBase((s) => s.hasCompletedOnboarding);
export const useUserName = () =>
  useOnboardingStoreBase((s) => s.userName);
export const useCompleteOnboarding = () =>
  useOnboardingStoreBase((s) => s.completeOnboarding);
export const useUpdateName = () =>
  useOnboardingStoreBase((s) => s.updateName);
export const useDefaultSnoozeLimit = () =>
  useOnboardingStoreBase((s) => s.defaultSnoozeLimit);
export const useUpdateDefaultSnoozeLimit = () =>
  useOnboardingStoreBase((s) => s.updateDefaultSnoozeLimit);
export const useDefaultDismissAction = () =>
  useOnboardingStoreBase((s) => s.defaultDismissAction);
export const useUpdateDefaultDismissAction = () =>
  useOnboardingStoreBase((s) => s.updateDefaultDismissAction);
export const useDefaultNagInterval = () =>
  useOnboardingStoreBase((s) => s.defaultNagInterval);
export const useUpdateDefaultNagInterval = () =>
  useOnboardingStoreBase((s) => s.updateDefaultNagInterval);
export const useDefaultWeeklyGoal = () =>
  useOnboardingStoreBase((s) => s.defaultWeeklyGoal);
export const useUpdateDefaultWeeklyGoal = () =>
  useOnboardingStoreBase((s) => s.updateDefaultWeeklyGoal);

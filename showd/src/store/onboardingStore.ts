import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  userName: string;
  defaultSnoozeLimit: number;

  completeOnboarding: () => void;
  updateName: (name: string) => void;
  updateDefaultSnoozeLimit: (limit: number) => void;
}

const useOnboardingStoreBase = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userName: '',
      defaultSnoozeLimit: 3,

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      updateName: (name: string) => set({ userName: name }),

      updateDefaultSnoozeLimit: (limit: number) => set({ defaultSnoozeLimit: limit }),
    }),
    {
      name: 'showd-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userName: state.userName,
        defaultSnoozeLimit: state.defaultSnoozeLimit,
      }),
    },
  ),
);

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

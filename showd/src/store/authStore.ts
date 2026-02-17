import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShallow } from 'zustand/react/shallow';
import type { User } from '../types/user';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  hasCompletedOnboarding: boolean;

  signIn: (user: User) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  updateProfile: (updates: Partial<User>) => void;
  hydrateFromCloud: (user: User) => void;
}

const useAuthStoreBase = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      hasCompletedOnboarding: false,

      signIn: (user) =>
        set({
          isAuthenticated: true,
          user,
          hasCompletedOnboarding: true,
        }),

      signOut: () =>
        set({
          isAuthenticated: false,
          user: null,
          hasCompletedOnboarding: false,
        }),

      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true }),

      updateProfile: (updates) =>
        set((state) => {
          if (!state.user) return {};
          const updated = { ...state.user, ...updates, updatedAt: new Date().toISOString() };
          return { user: updated };
        }),

      hydrateFromCloud: (user) =>
        set({ user, isAuthenticated: true, hasCompletedOnboarding: true }),
    }),
    {
      name: 'showd-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);

// Export a wrapped hook that uses useShallow for stable selections of objects/arrays
export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  return useAuthStoreBase(selector);
}

// Export stable selector hooks
export const useIsAuthenticated = () => useAuthStoreBase((s) => s.isAuthenticated);
export const useUser = () => useAuthStoreBase((s) => s.user);
export const useSignIn = () => useAuthStoreBase((s) => s.signIn);
export const useSignOut = () => useAuthStoreBase((s) => s.signOut);
export const useUpdateProfile = () => useAuthStoreBase((s) => s.updateProfile);
export const useHydrateAuth = () => useAuthStoreBase((s) => s.hydrateFromCloud);

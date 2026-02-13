// ============================================
// DEMO MODE: Supabase calls commented out.
// Using Zustand-only local state for demo.
// Search for [SUPABASE-TODO] to restore.
// ============================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShallow } from 'zustand/react/shallow';
import type { User } from '../types/user';
// [SUPABASE-TODO] Restore cloud sync: import { pushUser } from '../services/syncEngine';

interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: User | null;
  hasCompletedOnboarding: boolean;

  signIn: (user: User) => void;
  signInAsGuest: () => void;
  signOut: () => void;
  completeOnboarding: () => void;
  updateProfile: (updates: Partial<User>) => void;
  // [SUPABASE-TODO] Restore: hydrateFromCloud: (user: User) => void;
}

const useAuthStoreBase = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      user: null,
      hasCompletedOnboarding: false,

      signIn: (user) =>
        set({
          isAuthenticated: true,
          isGuest: false,
          user,
          hasCompletedOnboarding: true,
        }),

      signInAsGuest: () =>
        set({
          isAuthenticated: true,
          isGuest: true,
          hasCompletedOnboarding: true,
          user: {
            id: 'guest-001',
            phone: '',
            name: 'Guest',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            quietHoursEnabled: false,
            defaultSnoozeLimit: 3,
            isGuest: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),

      signOut: () =>
        set({
          isAuthenticated: false,
          isGuest: false,
          user: null,
        }),

      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true }),

      updateProfile: (updates) =>
        set((state) => {
          if (!state.user) return {};
          const updated = { ...state.user, ...updates, updatedAt: new Date().toISOString() };
          // [SUPABASE-TODO] Restore cloud sync: if (!state.isGuest) pushUser(updated);
          return { user: updated };
        }),

      // [SUPABASE-TODO] Restore hydrateFromCloud:
      // hydrateFromCloud: (user) =>
      //   set({ user, isAuthenticated: true, isGuest: false, hasCompletedOnboarding: true }),
    }),
    {
      name: 'showd-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);

// Export a wrapped hook that uses useShallow for stable selections of objects/arrays
// NOTE: For selecting primitives or single functions, use the stable hooks below instead
export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  return useAuthStoreBase(selector);
}

// Export stable selector hooks to avoid recreating selectors on each render
export const useIsAuthenticated = () => useAuthStoreBase((s) => s.isAuthenticated);
export const useIsGuest = () => useAuthStoreBase((s) => s.isGuest);
export const useUser = () => useAuthStoreBase((s) => s.user);
export const useSignIn = () => useAuthStoreBase((s) => s.signIn);
export const useSignInAsGuest = () => useAuthStoreBase((s) => s.signInAsGuest);
export const useSignOut = () => useAuthStoreBase((s) => s.signOut);
export const useUpdateProfile = () => useAuthStoreBase((s) => s.updateProfile);
// [SUPABASE-TODO] Restore: export const useHydrateAuth = () => useAuthStoreBase((s) => s.hydrateFromCloud);

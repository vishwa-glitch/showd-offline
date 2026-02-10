import { create } from 'zustand';
import { checkAllPermissions } from '../services/permissions';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface PermissionState {
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  batteryOptimizationDisabled: boolean;
  overlayGranted: boolean;

  onboardingPermissionsCompleted: boolean;
  oemSetupCompleted: boolean;
  permissionBannerDismissedAt: number | null;

  setPermissionStatus: (
    key: 'notificationsGranted' | 'exactAlarmGranted' | 'batteryOptimizationDisabled' | 'overlayGranted',
    value: boolean,
  ) => void;
  setOnboardingCompleted: () => void;
  setOEMSetupCompleted: () => void;
  dismissBanner: () => void;
  shouldShowBanner: () => boolean;
  hasMissingPermissions: () => boolean;
  refreshAllPermissions: () => Promise<void>;
}

const usePermissionStoreBase = create<PermissionState>((set, get) => ({
  notificationsGranted: false,
  exactAlarmGranted: true,
  batteryOptimizationDisabled: true,
  overlayGranted: true,

  onboardingPermissionsCompleted: false,
  oemSetupCompleted: false,
  permissionBannerDismissedAt: null,

  setPermissionStatus: (key, value) => set({ [key]: value }),

  setOnboardingCompleted: () => set({ onboardingPermissionsCompleted: true }),

  setOEMSetupCompleted: () => set({ oemSetupCompleted: true }),

  dismissBanner: () => set({ permissionBannerDismissedAt: Date.now() }),

  shouldShowBanner: () => {
    const state = get();
    if (!state.hasMissingPermissions()) return false;
    if (!state.permissionBannerDismissedAt) return true;
    return Date.now() - state.permissionBannerDismissedAt > SEVEN_DAYS_MS;
  },

  hasMissingPermissions: () => {
    const { notificationsGranted, exactAlarmGranted, batteryOptimizationDisabled } = get();
    return !notificationsGranted || !exactAlarmGranted || !batteryOptimizationDisabled;
  },

  refreshAllPermissions: async () => {
    try {
      const status = await checkAllPermissions();
      set({
        notificationsGranted: status.notifications,
        exactAlarmGranted: status.exactAlarm,
        batteryOptimizationDisabled: status.batteryOptimizationDisabled,
        overlayGranted: status.overlayPermission,
      });
    } catch {
      // Keep current state if check fails
    }
  },
}));

export const useNotificationsGranted = () => usePermissionStoreBase((s) => s.notificationsGranted);
export const useExactAlarmGranted = () => usePermissionStoreBase((s) => s.exactAlarmGranted);
export const useBatteryOptimizationDisabled = () => usePermissionStoreBase((s) => s.batteryOptimizationDisabled);
export const useOverlayGranted = () => usePermissionStoreBase((s) => s.overlayGranted);
export const useOnboardingPermissionsCompleted = () => usePermissionStoreBase((s) => s.onboardingPermissionsCompleted);
export const useOEMSetupCompleted = () => usePermissionStoreBase((s) => s.oemSetupCompleted);
export const useSetPermissionStatus = () => usePermissionStoreBase((s) => s.setPermissionStatus);
export const useSetOnboardingCompleted = () => usePermissionStoreBase((s) => s.setOnboardingCompleted);
export const useSetOEMSetupCompleted = () => usePermissionStoreBase((s) => s.setOEMSetupCompleted);
export const useDismissBanner = () => usePermissionStoreBase((s) => s.dismissBanner);
export const useShouldShowBanner = () => usePermissionStoreBase((s) => s.shouldShowBanner);
export const useHasMissingPermissions = () => usePermissionStoreBase((s) => s.hasMissingPermissions);
export const useRefreshAllPermissions = () => usePermissionStoreBase((s) => s.refreshAllPermissions);

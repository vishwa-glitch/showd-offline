import { Platform, Linking } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { isProblematicOEM, getOEMBrand, getOEMBatterySettingsIntent } from '../constants/oemConfig';

export interface PermissionStatus {
  notifications: boolean;
  exactAlarm: boolean;
  batteryOptimizationDisabled: boolean;
  overlayPermission: boolean;
}

/**
 * Check all critical permission statuses.
 */
export async function checkAllPermissions(): Promise<PermissionStatus> {
  // Notifications
  let notifications = false;
  try {
    const settings = await notifee.getNotificationSettings();
    notifications =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  } catch {
    notifications = false;
  }

  // Exact alarm (Android 12+)
  let exactAlarm = true;
  if (Platform.OS === 'android') {
    try {
      const granted = await notifee.getNotificationSettings();
      // On Android 12+, check if exact alarms are allowed
      // Notifee bundles this into its power manager checks
      exactAlarm = granted.android?.alarm === 1;
    } catch {
      exactAlarm = true; // Assume granted if check fails
    }
  }

  // Battery optimization
  let batteryOptimizationDisabled = true;
  if (Platform.OS === 'android') {
    try {
      const powerManagerInfo = await notifee.getPowerManagerInfo();
      batteryOptimizationDisabled = !powerManagerInfo.activity;
    } catch {
      batteryOptimizationDisabled = true;
    }
  }

  // Overlay (only matters on problematic OEMs)
  const overlayPermission = !isProblematicOEM();

  return {
    notifications,
    exactAlarm,
    batteryOptimizationDisabled,
    overlayPermission,
  };
}

/**
 * Request notification permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  } catch {
    return false;
  }
}

/**
 * Open exact alarm permission settings (Android 12+).
 */
export async function requestExactAlarmPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.openAlarmPermissionSettings();
  } catch {
    await Linking.openSettings();
  }
}

/**
 * Open battery optimization settings.
 */
export async function requestBatteryOptimizationDisable(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.openPowerManagerSettings();
  } catch {
    await Linking.openSettings();
  }
}

/**
 * Open overlay permission settings (for problematic OEMs).
 */
export async function requestOverlayPermission(): Promise<void> {
  await Linking.openSettings();
}

/**
 * Open OEM-specific battery/autostart settings.
 * Falls back to general app settings if deep link fails.
 */
export async function openOEMBatterySettings(): Promise<void> {
  const brand = getOEMBrand();
  const intent = getOEMBatterySettingsIntent(brand);

  if (intent) {
    try {
      const canOpen = await Linking.canOpenURL(`intent://${intent}`);
      if (canOpen) {
        await Linking.openURL(`intent://${intent}`);
        return;
      }
    } catch {
      // Fall through to general settings
    }
  }

  // Fallback: open power manager settings via Notifee, then app settings
  try {
    await notifee.openPowerManagerSettings();
  } catch {
    await Linking.openSettings();
  }
}

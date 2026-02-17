import { Platform, Linking } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { isProblematicOEM, getOEMBrand, getOEMBatterySettingsIntent } from '../constants/oemConfig';

export interface PermissionStatus {
  notifications: boolean;
  exactAlarm: boolean;
  batteryOptimizationDisabled: boolean;
  overlayPermission: boolean;
  fullScreenIntent: boolean;
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

  // Full-screen intent (Android 14+ requires explicit permission)
  let fullScreenIntent = true;
  if (Platform.OS === 'android' && Number(Platform.Version) >= 34) {
    try {
      const fsSettings = await notifee.getNotificationSettings();
      // On Android 14+, full-screen intent requires explicit grant
      // Notifee exposes this via the notification settings
      fullScreenIntent = fsSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    } catch {
      fullScreenIntent = true; // Assume granted if check fails
    }
  }

  return {
    notifications,
    exactAlarm,
    batteryOptimizationDisabled,
    overlayPermission,
    fullScreenIntent,
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
 * Open notification settings for full-screen intent permission (Android 14+).
 * On Android <14 this is auto-granted so this is a no-op.
 */
export async function requestFullScreenIntentPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 34) return;
  try {
    await notifee.openNotificationSettings();
  } catch {
    await Linking.openSettings();
  }
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

/**
 * OEM-specific autostart deep links.
 * Each brand has multiple possible intents — tried in order.
 */
const AUTOSTART_DEEP_LINKS: Record<string, string[]> = {
  xiaomi: [
    'miui.intent.action.OP_AUTO_START',
    'com.miui.securitycenter',
  ],
  redmi: [
    'miui.intent.action.OP_AUTO_START',
    'com.miui.securitycenter',
  ],
  poco: [
    'miui.intent.action.OP_AUTO_START',
    'com.miui.securitycenter',
  ],
  oppo: [
    'com.coloros.safecenter',
    'com.oppo.safe',
  ],
  realme: [
    'com.coloros.safecenter',
    'com.oplus.safe',
  ],
  vivo: [
    'com.vivo.permissionmanager',
    'com.iqoo.secure',
  ],
  iqoo: [
    'com.vivo.permissionmanager',
    'com.iqoo.secure',
  ],
  oneplus: [
    'com.oneplus.security',
  ],
  samsung: [
    'com.samsung.android.lool',
  ],
  huawei: [
    'com.huawei.systemmanager',
    'huawei.intent.action.HSM_BOOTAPP_MANAGER',
  ],
  honor: [
    'com.huawei.systemmanager',
    'huawei.intent.action.HSM_BOOTAPP_MANAGER',
  ],
};

/**
 * Open autostart settings for the current device's OEM.
 * Tries multiple deep link strategies per brand, then falls back gracefully.
 */
export async function openAutostartSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  const brand = (await import('expo-device')).brand?.toLowerCase() ?? '';
  const deepLinks = Object.entries(AUTOSTART_DEEP_LINKS).find(
    ([key]) => brand.includes(key),
  )?.[1];

  if (deepLinks) {
    for (const link of deepLinks) {
      // Try as intent action
      try {
        const intentUrl = `intent://#Intent;action=${link};end`;
        const canOpen = await Linking.canOpenURL(intentUrl);
        if (canOpen) {
          await Linking.openURL(intentUrl);
          return true;
        }
      } catch {
        // Try next strategy
      }

      // Try as package launch
      try {
        const packageUrl = `android-app://${link}`;
        const canOpen = await Linking.canOpenURL(packageUrl);
        if (canOpen) {
          await Linking.openURL(packageUrl);
          return true;
        }
      } catch {
        // Try next link
      }
    }
  }

  // All deep links failed — fall back to power manager, then general settings
  try {
    await notifee.openPowerManagerSettings();
    return true;
  } catch {
    await Linking.openSettings();
    return true;
  }
}

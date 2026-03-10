import { Platform, Linking } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { isProblematicOEM, getOEMBrand, getOEMBatterySettingsIntent } from '../constants/oemConfig';
import {
  canUseFullScreenIntent,
  canDrawOverlays,
  openOverlayPermissionSettings,
  openFullScreenIntentSettings,
} from './fullScreenIntentAccess';

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

  // Overlay ("Display over other apps" — SYSTEM_ALERT_WINDOW)
  let overlayPermission = true;
  if (Platform.OS === 'android') {
    overlayPermission = await canDrawOverlays();
  }

  // Full-screen notifications access (Android 14+)
  const fullScreenIntent = await canUseFullScreenIntent();

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
 * Open the "Display over other apps" (SYSTEM_ALERT_WINDOW) permission page
 * directly for this app. Falls back to general app settings.
 */
export async function requestOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // Try native module (direct ACTION_MANAGE_OVERLAY_PERMISSION intent)
  const opened = await openOverlayPermissionSettings();
  if (opened) return true;

  // Fallback: general app settings
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}

/**
 * Open the full-screen intent permission page for this app (Android 14+).
 *
 * Uses ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT to go directly to the
 * toggle. Falls back to notification settings → app settings if the
 * intent is unavailable on the device.
 *
 * Returns `true` if a settings page was successfully opened.
 */
export async function requestFullScreenIntentPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // Strategy 1: Native exact settings intent.
  const openedNative = await openFullScreenIntentSettings();
  if (openedNative) return true;

  // Strategy 2: JS intent fallback for older native binaries.
  try {
    if (Number(Platform.Version) >= 34) {
      const intentUrl = 'intent:#Intent;action=android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT;end';
      const canOpen = await Linking.canOpenURL(intentUrl);
      if (canOpen) {
        await Linking.openURL(intentUrl);
        return true;
      }
    }
  } catch {
    // Intent unavailable - try next strategy.
  }

  // Strategy 3: App notification settings.
  try {
    await notifee.openNotificationSettings();
    return true;
  } catch {
    // Unavailable.
  }

  // Strategy 4: General app settings.
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
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


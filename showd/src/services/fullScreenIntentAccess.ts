import { NativeModules, Platform } from 'react-native';

type ShowdNativeModule = {
  canUseFullScreenIntent: () => Promise<boolean>;
  openFullScreenIntentSettings: () => Promise<boolean>;
  canDrawOverlays: () => Promise<boolean>;
  openOverlayPermissionSettings: () => Promise<boolean>;
  openAppForReminderIfUnlocked: (taskId: string) => Promise<boolean>;
  showReminderOverlay: (
    taskId: string,
    title: string,
    body: string,
    description?: string,
    soundId?: string,
    witnessPhotoUri?: string
  ) => Promise<boolean>;
  hideReminderOverlay: () => Promise<boolean>;
  consumePendingOverlayAction: () => Promise<{
    action?: string;
    taskId?: string;
  } | null>;
};

const nativeModule = NativeModules.ShowdFullScreenIntent as
  | ShowdNativeModule
  | undefined;

/**
 * Android 14+ exposes NotificationManager.canUseFullScreenIntent().
 * Returns true on unsupported platforms/versions.
 */
export async function canUseFullScreenIntent(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) < 34) return true;
  if (!nativeModule?.canUseFullScreenIntent) return true;

  try {
    const allowed = await nativeModule.canUseFullScreenIntent();
    return Boolean(allowed);
  } catch {
    return true;
  }
}

/**
 * Open full-screen intent settings for this app.
 * Android 14+: opens ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT.
 * Older Android: falls back to app notification settings.
 */
export async function openFullScreenIntentSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!nativeModule?.openFullScreenIntentSettings) return false;

  try {
    return Boolean(await nativeModule.openFullScreenIntentSettings());
  } catch {
    return false;
  }
}

/**
 * Check if the app has SYSTEM_ALERT_WINDOW ("Display over other apps") permission.
 * Returns true on non-Android or pre-Marshmallow devices.
 */
export async function canDrawOverlays(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) < 23) return true;
  if (!nativeModule?.canDrawOverlays) return false; // Assume denied if native module not available

  try {
    const allowed = await nativeModule.canDrawOverlays();
    return Boolean(allowed);
  } catch {
    return false;
  }
}

/**
 * Open the system settings page for SYSTEM_ALERT_WINDOW ("Display over other apps")
 * directly for this app. Returns true if the settings page was opened.
 */
export async function openOverlayPermissionSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!nativeModule?.openOverlayPermissionSettings) return false;

  try {
    return await nativeModule.openOverlayPermissionSettings();
  } catch {
    return false;
  }
}

/**
 * Bring the app to foreground for a reminder only when device is unlocked and
 * overlay permission is granted. Best-effort; returns whether launch was attempted.
 */
export async function openAppForReminderIfUnlocked(taskId: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!taskId) return false;
  if (!nativeModule?.openAppForReminderIfUnlocked) return false;

  try {
    return await nativeModule.openAppForReminderIfUnlocked(taskId);
  } catch {
    return false;
  }
}

export interface PendingOverlayAction {
  action: 'done' | 'snooze' | 'open';
  taskId: string;
}

/**
 * Show a true Android system overlay window (TYPE_APPLICATION_OVERLAY) above
 * other apps while unlocked.
 */
export async function showSystemReminderOverlay(
  taskId: string,
  title: string,
  body: string,
  description: string = '',
  soundId: string = '',
  witnessPhotoUri: string = '',
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!taskId) return false;
  if (!nativeModule?.showReminderOverlay) return false;

  try {
    return await nativeModule.showReminderOverlay(taskId, title, body, description, soundId, witnessPhotoUri);
  } catch {
    // Backward compatibility for users running an older native binary.
    try {
      return await nativeModule.showReminderOverlay(taskId, title, body, description, soundId);
    } catch {
      try {
        return await nativeModule.showReminderOverlay(taskId, title, body, description);
      } catch {
        try {
          return await nativeModule.showReminderOverlay(taskId, title, body);
        } catch {
          return false;
        }
      }
    }
  }
}

/**
 * Hide the native system reminder overlay if currently visible.
 */
export async function hideSystemReminderOverlay(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!nativeModule?.hideReminderOverlay) return false;

  try {
    return await nativeModule.hideReminderOverlay();
  } catch {
    return false;
  }
}

/**
 * Consume one pending action emitted by the native system overlay buttons.
 */
export async function consumePendingSystemOverlayAction(): Promise<PendingOverlayAction | null> {
  if (Platform.OS !== 'android') return null;
  if (!nativeModule?.consumePendingOverlayAction) return null;

  try {
    const result = await nativeModule.consumePendingOverlayAction();
    const action = result?.action;
    const taskId = result?.taskId;
    if (!action || !taskId) return null;
    if (action !== 'done' && action !== 'snooze' && action !== 'open') return null;
    return { action, taskId };
  } catch {
    return null;
  }
}

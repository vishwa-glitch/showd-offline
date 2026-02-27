import { NativeModules, Platform } from 'react-native';

type FullScreenIntentNativeModule = {
  canUseFullScreenIntent: () => Promise<boolean>;
};

const nativeModule = NativeModules.ShowdFullScreenIntent as
  | FullScreenIntentNativeModule
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


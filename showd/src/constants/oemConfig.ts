import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type OEMBrand =
  | 'xiaomi'
  | 'samsung'
  | 'huawei'
  | 'oneplus'
  | 'oppo'
  | 'vivo'
  | 'realme'
  | 'other';

const PROBLEMATIC_OEMS = [
  'xiaomi', 'redmi', 'poco',
  'samsung',
  'huawei', 'honor',
  'oneplus',
  'oppo',
  'vivo', 'iqoo',
  'realme',
  'meizu',
  'asus',
  'lenovo',
  'tecno', 'infinix',
];

function getAndroidOEMSignature(): string {
  if (Platform.OS !== 'android') return '';
  const brand = (Device.brand ?? '').toLowerCase();
  const manufacturer = (Device.manufacturer ?? '').toLowerCase();
  return `${brand} ${manufacturer}`.trim();
}

export function getOEMBrand(): OEMBrand {
  if (Platform.OS !== 'android') return 'other';
  const signature = getAndroidOEMSignature();
  if (['xiaomi', 'redmi', 'poco'].some((k) => signature.includes(k))) return 'xiaomi';
  if (signature.includes('samsung')) return 'samsung';
  if (['huawei', 'honor'].some((k) => signature.includes(k))) return 'huawei';
  if (signature.includes('oneplus')) return 'oneplus';
  if (signature.includes('oppo')) return 'oppo';
  if (['vivo', 'iqoo'].some((k) => signature.includes(k))) return 'vivo';
  if (signature.includes('realme')) return 'realme';
  return 'other';
}

export function isProblematicOEM(): boolean {
  if (Platform.OS !== 'android') return false;
  const signature = getAndroidOEMSignature();
  return PROBLEMATIC_OEMS.some((oem) => signature.includes(oem));
}

export function getOEMDisplayName(): string {
  const brand = getOEMBrand();
  const names: Record<OEMBrand, string> = {
    xiaomi: 'Xiaomi',
    samsung: 'Samsung',
    huawei: 'Huawei',
    oneplus: 'OnePlus',
    oppo: 'Oppo',
    vivo: 'Vivo',
    realme: 'Realme',
    other: (Device.brand ?? ''),
  };
  return names[brand];
}

export interface OEMStep {
  title: string;
  description: string;
}

export function getOEMInstructions(brand: OEMBrand): OEMStep[] {
  switch (brand) {
    case 'xiaomi':
      return [
        {
          title: 'Turn on Autostart',
          description: 'Find Showd in the app list and enable Autostart',
        },
        {
          title: 'Set Battery to No Restrictions',
          description: 'Go to Battery Saver \u2192 Showd \u2192 No restrictions',
        },
        {
          title: 'Lock app in Recents',
          description:
            'Open Showd in recent apps, swipe down on it to lock it (you\'ll see a lock icon)',
        },
      ];
    case 'samsung':
      return [
        {
          title: 'Set Battery to Unrestricted',
          description:
            'Go to Battery \u2192 Background usage limits \u2192 Never sleeping apps \u2192 Add Showd',
        },
        {
          title: 'Turn off Adaptive Battery for Showd',
          description: 'Battery \u2192 Showd \u2192 Unrestricted',
        },
      ];
    case 'huawei':
      return [
        {
          title: 'Set App Launch to Manual',
          description:
            'Go to Battery \u2192 App Launch \u2192 Find Showd \u2192 Set to "Manage manually"',
        },
        {
          title: 'Enable all three toggles',
          description:
            'Turn on Auto-launch, Secondary launch, and Run in background',
        },
      ];
    case 'oneplus':
      return [
        {
          title: 'Disable Battery Optimization',
          description:
            'Go to Battery \u2192 Battery Optimization \u2192 Showd \u2192 Don\'t optimize',
        },
        {
          title: 'Enable Auto-launch',
          description:
            'Settings \u2192 Apps \u2192 Showd \u2192 Auto-launch \u2192 Enable',
        },
      ];
    case 'oppo':
      return [
        {
          title: 'Enable Auto-startup',
          description:
            'Settings \u2192 App Management \u2192 Showd \u2192 Auto-startup \u2192 Enable',
        },
        {
          title: 'Allow Background Running',
          description: 'Battery \u2192 Showd \u2192 Allow background activity',
        },
      ];
    case 'vivo':
      return [
        {
          title: 'Enable Autostart',
          description:
            'Settings \u2192 More Settings \u2192 Applications \u2192 Autostart \u2192 Enable Showd',
        },
        {
          title: 'Allow High Background Power',
          description:
            'Battery \u2192 High background power consumption \u2192 Enable Showd',
        },
      ];
    case 'realme':
      return [
        {
          title: 'Enable Auto-startup',
          description:
            'Settings \u2192 App Management \u2192 Showd \u2192 Auto-startup \u2192 Enable',
        },
        {
          title: 'Allow Background Activity',
          description: 'Battery \u2192 Showd \u2192 Allow background activity',
        },
      ];
    default:
      return [
        {
          title: 'Disable Battery Optimization',
          description:
            'Go to Settings \u2192 Battery \u2192 Showd \u2192 Don\'t optimize / Unrestricted',
        },
        {
          title: 'Allow Background Activity',
          description:
            'Make sure Showd is allowed to run in the background',
        },
      ];
  }
}

export function getOEMBatterySettingsIntent(brand: OEMBrand): string | null {
  const intents: Partial<Record<OEMBrand, string>> = {
    xiaomi: 'miui.intent.action.HIDDEN_APPS_CONFIG_ACTIVITY',
    samsung: 'android.settings.APP_BATTERY_SETTINGS',
    huawei: 'huawei.intent.action.HSM_BOOTAPP_MANAGER',
    oppo: 'com.coloros.safecenter',
    vivo: 'com.vivo.permissionmanager',
  };
  return intents[brand] ?? null;
}

/**
 * Brand-specific full-screen intent/notification permission instructions.
 * Used as fallback when the direct system intent fails.
 */
export function getFullScreenIntentInstructions(brand: OEMBrand): OEMStep[] {
  switch (brand) {
    case 'samsung':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps',
        },
        {
          title: 'Open the \u22ee menu',
          description: 'Tap the three-dot menu (\u22ee) in the top-right corner',
        },
        {
          title: 'Special access',
          description: 'Tap "Special access"',
        },
        {
          title: 'Full screen notifications',
          description: 'Tap "Full screen notifications"',
        },
        {
          title: 'Enable Showd',
          description: 'Find Showd and turn the toggle ON',
        },
      ];
    case 'xiaomi':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps \u2192 Manage apps',
        },
        {
          title: 'Find Showd',
          description: 'Search for "Showd" and tap on it',
        },
        {
          title: 'Other permissions',
          description: 'Tap "Other permissions"',
        },
        {
          title: 'Enable display permissions',
          description: 'Turn ON:\n\u2022 Show on Lock screen\n\u2022 Display pop-up windows\n\u2022 Display pop-up windows while running in background',
        },
        {
          title: 'Enable Autostart',
          description: 'Go back and also enable "Autostart" for Showd',
        },
      ];
    case 'oppo':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps \u2192 Special app access',
        },
        {
          title: 'Full screen notifications',
          description: 'Tap "Full screen notifications"',
        },
        {
          title: 'Enable Showd',
          description: 'Find Showd and turn the toggle ON',
        },
      ];
    case 'oneplus':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps \u2192 Special app access',
        },
        {
          title: 'Full screen notifications',
          description: 'Tap "Full screen notifications"',
        },
        {
          title: 'Enable Showd',
          description: 'Find Showd and turn the toggle ON',
        },
      ];
    case 'realme':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps \u2192 Special app access',
        },
        {
          title: 'Send full screen notifications',
          description: 'Tap "Send full screen notifications"',
        },
        {
          title: 'Enable Showd',
          description: 'Find Showd and turn the toggle ON',
        },
      ];
    case 'vivo':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps & Permissions',
        },
        {
          title: 'Permission management',
          description: 'Tap "Permission management"',
        },
        {
          title: 'Find Showd',
          description: 'Search for "Showd" and tap on it',
        },
        {
          title: 'Display on lock screen',
          description: 'Enable "Display on lock screen" permission',
        },
      ];
    case 'huawei':
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps \u2192 Apps',
        },
        {
          title: 'Find Showd',
          description: 'Search for "Showd" and tap on it',
        },
        {
          title: 'Notifications',
          description: 'Tap "Notifications" \u2192 Enable "Allow notifications" and "Banners"',
        },
        {
          title: 'Special access',
          description: 'Go back to Settings \u2192 Apps \u2192 Special access \u2192 Battery optimization \u2192 Set Showd to "Don\'t optimize"',
        },
      ];
    default:
      // Standard Android (Google Pixel, etc.)
      return [
        {
          title: 'Open Settings',
          description: 'Go to Settings \u2192 Apps',
        },
        {
          title: 'Special app access',
          description: 'Tap "Special app access" (at the bottom)',
        },
        {
          title: 'Manage full screen intents',
          description: 'Tap "Manage full screen intents" (or "Full screen notifications")',
        },
        {
          title: 'Enable Showd',
          description: 'Find Showd and turn the toggle ON',
        },
      ];
  }
}

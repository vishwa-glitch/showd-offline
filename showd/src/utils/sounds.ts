export interface SoundOption {
  id: string;
  name: string;
  description: string;
  loopDuration: number;
}

export const BUILT_IN_SOUNDS: readonly SoundOption[] = [
  { id: 'gentle_pulse', name: 'Gentle Pulse', description: 'Default \u00B7 Soft escalating', loopDuration: 3 },
  { id: 'morning_call', name: 'Morning Call', description: 'Bright, optimistic ring', loopDuration: 2 },
  { id: 'steady_knock', name: 'Steady Knock', description: 'Rhythmic knocking pattern', loopDuration: 2.5 },
  { id: 'urgent_bell', name: 'Urgent Bell', description: 'More aggressive', loopDuration: 1.5 },
  { id: 'calm_wave', name: 'Calm Wave', description: 'Gentlest option', loopDuration: 4 },
] as const;

export const DEFAULT_SOUND_ID = 'gentle_pulse';
// Bump channel id when channel-level sound config changes on Android.
// Android channels are immutable once created, so versioning forces a clean channel.
export const REMINDER_CHANNEL_ID = 'showd-reminder-v2';

export function getSoundName(soundId: string): string {
  const found = BUILT_IN_SOUNDS.find((s) => s.id === soundId);
  return found?.name ?? 'Custom';
}

export function isBuiltInSound(soundId: string): boolean {
  return BUILT_IN_SOUNDS.some((s) => s.id === soundId);
}

/**
 * Returns the Notifee channel ID for a given sound.
 */
export function getChannelIdForSound(soundId: string): string {
  void soundId;
  return REMINDER_CHANNEL_ID;
}

/**
 * Static require() map for expo-audio playback.
 * React Native requires static paths — cannot be computed dynamically.
 */
export const SOUND_ASSETS: Record<string, any> = {
  gentle_pulse: require('../assets/sounds/gentle_pulse.mp3'),
  morning_call: require('../assets/sounds/morning_call.mp3'),
  steady_knock: require('../assets/sounds/steady_knock.mp3'),
  urgent_bell: require('../assets/sounds/urgent_bell.mp3'),
  calm_wave: require('../assets/sounds/calm_wave.mp3'),
};

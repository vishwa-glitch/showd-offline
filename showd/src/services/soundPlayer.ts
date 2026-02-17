import { Audio } from 'expo-av';
import { SOUND_ASSETS } from '../utils/sounds';

let currentSound: Audio.Sound | null = null;
let previewTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Play a sound. Optionally loop it (for full-screen reminders).
 * Stops any currently playing sound first.
 */
export async function playSound(soundId: string, loop = false): Promise<void> {
    await stopSound();

    const asset = SOUND_ASSETS[soundId];
    if (!asset) {
        console.warn(`[soundPlayer] No asset found for sound: ${soundId}`);
        return;
    }

    try {
        // Configure audio mode for playback even in silent mode
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(asset, {
            shouldPlay: true,
            isLooping: loop,
            volume: 1.0,
        });
        currentSound = sound;
    } catch (err) {
        console.warn('[soundPlayer] Failed to play sound:', err);
    }
}

/**
 * Stop the currently playing sound and clean up.
 */
export async function stopSound(): Promise<void> {
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }

    if (currentSound) {
        try {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
        } catch {
            // Sound may already be unloaded
        }
        currentSound = null;
    }
}

/**
 * Preview a sound for a set duration (default 3 seconds), then stop.
 */
export async function previewSound(soundId: string, durationMs = 3000): Promise<void> {
    await playSound(soundId, false);

    previewTimeout = setTimeout(async () => {
        await stopSound();
        previewTimeout = null;
    }, durationMs);
}

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { SOUND_ASSETS } from '../utils/sounds';

let currentPlayer: AudioPlayer | null = null;
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
        await setAudioModeAsync({
            playsInSilentMode: true,
            shouldRouteThroughEarpiece: false,
        });

        const player = createAudioPlayer(asset);
        player.loop = loop;
        player.volume = 1.0;
        player.play();
        currentPlayer = player;
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

    const playerToStop = currentPlayer;
    currentPlayer = null;

    if (playerToStop) {
        try {
            playerToStop.pause();
        } catch {
            // Player may already be stopped
        }
        try {
            playerToStop.remove();
        } catch {
            // Player may already be released
        }
    }
}

/**
 * Preview a sound for a set duration (default 3 seconds), then stop.
 */
export async function previewSound(soundId: string, durationMs = 3000): Promise<void> {
    await playSound(soundId, false);

    // Capture reference to the player we just created
    const playerRef = currentPlayer;

    previewTimeout = setTimeout(async () => {
        // Only stop if the same player is still active (not replaced by another preview)
        if (currentPlayer === playerRef) {
            await stopSound();
        }
        previewTimeout = null;
    }, durationMs);
}

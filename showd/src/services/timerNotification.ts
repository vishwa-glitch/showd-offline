import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

const TIMER_CHANNEL_ID = 'showd-timer';
const TIMER_NOTIFICATION_ID = 'showd-active-timer';

/**
 * Initialize the timer notification channel.
 * Call once at app startup alongside initializeNotifications().
 */
export async function initializeTimerChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: TIMER_CHANNEL_ID,
      name: 'Focus Timer',
      description: 'Shows progress while a focus timer is running',
      importance: AndroidImportance.LOW,
      vibration: false,
    });
  }
}

/**
 * Show the persistent timer notification with a real-time countdown
 * using Android's native chronometer (no repeated updates needed).
 */
export async function showTimerNotification(
  taskName: string,
  remainingSeconds: number,
): Promise<void> {
  await notifee.displayNotification({
    id: TIMER_NOTIFICATION_ID,
    title: `Timer: ${taskName}`,
    body: 'Focus timer running',
    android: {
      channelId: TIMER_CHANNEL_ID,
      importance: AndroidImportance.LOW,
      ongoing: true,
      pressAction: { id: 'default' },
      autoCancel: false,
      showChronometer: true,
      chronometerDirection: 'down',
      timestamp: Date.now() + remainingSeconds * 1000,
    },
  });
}

/**
 * Show a static paused notification (no chronometer ticking).
 */
export async function showPausedTimerNotification(
  taskName: string,
  remainingSeconds: number,
): Promise<void> {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  await notifee.displayNotification({
    id: TIMER_NOTIFICATION_ID,
    title: `Timer: ${taskName} (Paused)`,
    body: `${timeStr} remaining`,
    android: {
      channelId: TIMER_CHANNEL_ID,
      importance: AndroidImportance.LOW,
      ongoing: true,
      pressAction: { id: 'default' },
      autoCancel: false,
      showChronometer: false,
    },
  });
}

/**
 * Remove the timer notification when timer completes or is abandoned.
 */
export async function removeTimerNotification(): Promise<void> {
  await notifee.cancelNotification(TIMER_NOTIFICATION_ID);
}

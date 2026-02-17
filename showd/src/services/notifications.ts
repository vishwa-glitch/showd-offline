import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  EventType,
  type TimestampTrigger,
  type Notification,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import type { Task } from '../types/task';
import { BUILT_IN_SOUNDS, DEFAULT_SOUND_ID, getChannelIdForSound } from '../utils/sounds';
import { getSelectedSoundId } from '../store/soundStore';

const SERVICE_CHANNEL_ID = 'showd-service';
const VIBRATION_PATTERN = [0, 400, 200, 400, 200, 400];

/**
 * Initialize notification channels and event handlers.
 * Call once at app startup.
 */
export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    // Create one notification channel per built-in sound
    for (const sound of BUILT_IN_SOUNDS) {
      await notifee.createChannel({
        id: `showd-reminder-${sound.id}`,
        name: `Reminders (${sound.name})`,
        importance: AndroidImportance.HIGH,
        sound: sound.id,
        vibration: true,
        vibrationPattern: VIBRATION_PATTERN,
        bypassDnd: true,
      });
    }

    // Custom sound channel (Pro users)
    await notifee.createChannel({
      id: 'showd-reminder-custom',
      name: 'Reminders (Custom Sound)',
      importance: AndroidImportance.HIGH,
      sound: DEFAULT_SOUND_ID,
      vibration: true,
      vibrationPattern: VIBRATION_PATTERN,
      bypassDnd: true,
    });

    await notifee.createChannel({
      id: SERVICE_CHANNEL_ID,
      name: 'Background Service',
      description: 'Keeps reminders running reliably',
      importance: AndroidImportance.LOW,
    });
  }

  // Request permissions (iOS)
  if (Platform.OS === 'ios') {
    await notifee.requestPermission({
      sound: true,
      alert: true,
      badge: true,
      criticalAlert: true,
    });
  }
}

/**
 * Register foreground event handler.
 * Must be called at the top level (outside component).
 */
export function registerForegroundHandler(
  onReminderTriggered: (taskId: string) => void,
): () => void {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const taskId = detail.notification?.data?.taskId as string | undefined;
      if (taskId) {
        onReminderTriggered(taskId);
      }
    }
  });
}

/**
 * Register background event handler.
 * Must be called at the top level of the app entry (index.ts or App.tsx).
 */
export function registerBackgroundHandler(
  onReminderTriggered: (taskId: string) => void,
): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const taskId = detail.notification?.data?.taskId as string | undefined;
      if (taskId) {
        onReminderTriggered(taskId);
      }
    }
  });
}

/**
 * Calculate the next trigger timestamp for a task's reminder.
 */
function getNextTriggerTime(task: Task): number | null {
  const now = new Date();
  const [hours, minutes] = task.reminderTime.split(':').map(Number);

  if (task.frequency === 'once') {
    if (task.oneTimeDate) {
      const target = new Date(task.oneTimeDate);
      target.setHours(hours, minutes, 0, 0);
      return target.getTime() > now.getTime() ? target.getTime() : null;
    }
    // If no date, schedule for today or tomorrow
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    if (today.getTime() > now.getTime()) return today.getTime();
    // Already past today — no reschedule for one-time
    return null;
  }

  if (task.frequency === 'daily') {
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  if (task.frequency === 'weekly' && task.frequencyDays?.length) {
    // frequencyDays: 0=Sun, 1=Mon, ... 6=Sat
    const currentDay = now.getDay();
    const sortedDays = [...task.frequencyDays].sort((a, b) => a - b);

    for (const day of sortedDays) {
      const diff = (day - currentDay + 7) % 7;
      const target = new Date();
      target.setDate(target.getDate() + (diff === 0 ? 0 : diff));
      target.setHours(hours, minutes, 0, 0);
      if (target.getTime() > now.getTime()) return target.getTime();
    }
    // Wrap to next week's first day
    const firstDay = sortedDays[0];
    const diff = (firstDay - currentDay + 7) % 7 || 7;
    const target = new Date();
    target.setDate(target.getDate() + diff);
    target.setHours(hours, minutes, 0, 0);
    return target.getTime();
  }

  if (task.frequency === 'custom' && task.customIntervalDays) {
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + task.customIntervalDays);
    }
    return target.getTime();
  }

  return null;
}

/**
 * Build the notification payload for a task.
 */
function buildNotification(task: Task): Notification {
  const witnessLabel =
    task.accountabilityType === 'real' && task.witnessName
      ? `${task.witnessName} is counting on you`
      : task.accountabilityType === 'personal' && task.personalWitnessName
        ? `Don't let ${task.personalWitnessName} down`
        : 'Time to show up for yourself';

  // Use the globally selected sound (offline, from AsyncStorage-persisted store)
  const soundId = getSelectedSoundId();
  const channelId = getChannelIdForSound(soundId);

  return {
    id: task.id,
    title: task.name,
    body: witnessLabel,
    data: { taskId: task.id },
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      fullScreenAction: { id: 'default' },
      ongoing: true,
      pressAction: { id: 'default' },
      vibrationPattern: VIBRATION_PATTERN,
    },
    ios: {
      sound: `${soundId}.mp3`,
      interruptionLevel: 'timeSensitive',
    },
  };
}

/**
 * Schedule a notification for a task's next reminder time.
 */
export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (!task.isActive) return;

  const triggerTime = getNextTriggerTime(task);
  if (!triggerTime) return;

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerTime,
  };

  const notification = buildNotification(task);

  await notifee.createTriggerNotification(notification, trigger);
}

/**
 * Reschedule a notification 15 minutes from now (snooze).
 */
export async function rescheduleAfterSnooze(task: Task): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 15 * 60 * 1000,
  };

  const notification = buildNotification(task);

  await notifee.createTriggerNotification(notification, trigger);
}

/**
 * Cancel a scheduled notification for a task.
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  await notifee.cancelNotification(taskId);
  await notifee.cancelTriggerNotification(taskId);
}

/**
 * Cancel all scheduled notifications (e.g., on sign out).
 */
export async function cancelAllReminders(): Promise<void> {
  await notifee.cancelAllNotifications();
  await notifee.cancelTriggerNotifications();
}

/**
 * Display an immediate notification (for testing or instant reminders).
 */
export async function displayImmediateReminder(task: Task): Promise<void> {
  const notification = buildNotification(task);
  await notifee.displayNotification(notification);
}

/**
 * Reconcile scheduled notifications with current task list.
 * Call on app open to ensure all active tasks have correct notifications.
 */
export async function reconcileNotifications(tasks: Task[]): Promise<void> {
  // Cancel all existing trigger notifications
  await notifee.cancelTriggerNotifications();

  // Reschedule for all active tasks
  for (const task of tasks) {
    if (task.isActive) {
      await scheduleTaskReminder(task);
    }
  }
}

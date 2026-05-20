import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  AlarmType,
  TriggerType,
  EventType,
  type TimestampTrigger,
  type Notification,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types/task';
import { getChannelIdForSound, REMINDER_CHANNEL_ID } from '../utils/sounds';
import { getSelectedSoundId } from '../store/soundStore';
import { parseReminderTime } from '../utils/reminderTime';
import { showSystemReminderOverlay, hideSystemReminderOverlay } from './fullScreenIntentAccess';

const SERVICE_CHANNEL_ID = 'showd-service';
// Must be an even-length array of positive values for Notifee.
const VIBRATION_PATTERN = [100, 400, 200, 400, 200, 400];
const PENDING_REMINDER_KEY = 'showd.pendingReminderTaskId';
const SCHEDULE_GRACE_MS = 2 * 60 * 1000;
const SCHEDULE_FALLBACK_DELAY_MS = 5 * 1000;
const SNOOZE_NOTIFICATION_SUFFIX = ':snooze';

function adjustIfJustMissed(targetTime: number, nowTime: number): number | null {
  if (targetTime > nowTime) return targetTime;
  if (nowTime - targetTime <= SCHEDULE_GRACE_MS) {
    return nowTime + SCHEDULE_FALLBACK_DELAY_MS;
  }
  return null;
}

function getSnoozeNotificationId(taskId: string): string {
  return `${taskId}${SNOOZE_NOTIFICATION_SUFFIX}`;
}

async function persistPendingReminder(taskId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_REMINDER_KEY, taskId);
  } catch {
    // Best-effort only
  }
}

async function consumePendingReminder(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_REMINDER_KEY);
    if (stored) {
      await AsyncStorage.removeItem(PENDING_REMINDER_KEY);
      return stored;
    }
  } catch {
    // Best-effort only
  }
  return null;
}

/**
 * Initialize notification channels and event handlers.
 * Call once at app startup.
 */
export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'reminder_sound',
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
  onReminderTriggered?: (taskId: string) => void,
): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const taskId = detail.notification?.data?.taskId as string | undefined;
      if (taskId) {
        await persistPendingReminder(taskId);

        // Phase 2: render a true system overlay window on unlocked devices.
        // If unsupported/blocked, this fails gracefully and Notifee heads-up/FSI still applies.
        if (type === EventType.DELIVERED) {
          const title = detail.notification?.title || 'Reminder';
          const body = detail.notification?.body || 'Time to show up for yourself';
          const rawDescription = detail.notification?.data?.description;
          const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
          const rawSoundId = detail.notification?.data?.soundId;
          const soundId = typeof rawSoundId === 'string' ? rawSoundId.trim() : '';
          const rawWitnessPhotoUri = detail.notification?.data?.witnessPhotoUri;
          const witnessPhotoUri = typeof rawWitnessPhotoUri === 'string' ? rawWitnessPhotoUri.trim() : '';
          await showSystemReminderOverlay(taskId, title, body, description, soundId, witnessPhotoUri);
        }
        onReminderTriggered?.(taskId);
      }
    }
  });
}

/**
 * Calculate the next trigger timestamp for a task's reminder.
 */
function getAdjustedTargetTime(
  targetTime: number,
  nowTime: number,
  useGraceWindow: boolean,
): number | null {
  if (useGraceWindow) {
    return adjustIfJustMissed(targetTime, nowTime);
  }
  return targetTime > nowTime ? targetTime : null;
}

function getNextTriggerTime(task: Task, useGraceWindow: boolean): number | null {
  const now = new Date();
  const parsedTime = parseReminderTime(task.reminderTime);
  if (!parsedTime) return null;
  const { hours, minutes } = parsedTime;

  if (task.frequency === 'once') {
    if (task.oneTimeDate) {
      const target = new Date(task.oneTimeDate);
      target.setHours(hours, minutes, 0, 0);
      const adjusted = getAdjustedTargetTime(target.getTime(), now.getTime(), useGraceWindow);
      return adjusted ?? null;
    }
    // If no date, schedule for today or tomorrow
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    const adjusted = getAdjustedTargetTime(today.getTime(), now.getTime(), useGraceWindow);
    if (adjusted != null) return adjusted;
    // Already past today ? no reschedule for one-time
    return null;
  }

  if (task.frequency === 'daily') {
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const adjusted = getAdjustedTargetTime(target.getTime(), now.getTime(), useGraceWindow);
    if (adjusted != null) return adjusted;
    target.setDate(target.getDate() + 1);
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
      if (diff === 0) {
        const adjusted = getAdjustedTargetTime(target.getTime(), now.getTime(), useGraceWindow);
        if (adjusted != null) return adjusted;
      }
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
    const adjusted = getAdjustedTargetTime(target.getTime(), now.getTime(), useGraceWindow);
    if (adjusted != null) return adjusted;
    target.setDate(target.getDate() + task.customIntervalDays);
    return target.getTime();
  }

  return null;
}

function buildTimestampTrigger(timestamp: number): TimestampTrigger {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
  };

  if (Platform.OS === 'android') {
    trigger.alarmManager = {
      type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
    };
  }

  return trigger;
}

/**
 * Build the notification payload for a task.
 */
function buildNotification(task: Task, notificationId: string = task.id): Notification {
  // Use the globally selected sound (offline, from AsyncStorage-persisted store)
  const soundId = getSelectedSoundId();
  const channelId = getChannelIdForSound(soundId);
  const description = task.description?.trim() || '';

  return {
    id: notificationId,
    title: task.name,
    body: 'Time to show up for yourself',
    data: { taskId: task.id, description, soundId },
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      category: AndroidCategory.ALARM,
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      ongoing: true,
      pressAction: { id: 'default', launchActivity: 'default' },
      vibrationPattern: VIBRATION_PATTERN,
      // Add heavy customization to ensure it grabs attention
      lights: ['red', 300, 600],
    },
    ios: {
      sound: `${soundId}.mp3`,
      interruptionLevel: 'timeSensitive',
    },
  };
}

async function dismissDisplayedRemindersForTask(taskId: string): Promise<void> {
  try {
    const displayed = await notifee.getDisplayedNotifications();
    const toCancel = displayed.filter(
      (item) => item.notification?.data?.taskId === taskId,
    );

    for (const item of toCancel) {
      const id = item.notification?.id;
      if (id) {
        await notifee.cancelNotification(id);
      }
    }
  } catch {
    // Best-effort only
  }
}

/**
 * Schedule a notification for a task's next reminder time.
 */
export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (!task.isActive) return;

  const triggerTime = getNextTriggerTime(task, true);
  if (!triggerTime) return;

  const trigger = buildTimestampTrigger(triggerTime);

  const notification = buildNotification(task, task.id);

  await notifee.createTriggerNotification(notification, trigger);
}

/**
 * Schedule the next regular reminder window for recurring tasks.
 * This intentionally does NOT use the near-miss grace window.
 */
export async function scheduleNextRegularReminder(task: Task): Promise<void> {
  if (!task.isActive) return;
  if (task.frequency === 'once') return;
  if (task.triggerType === 'first_unlock') return;

  const triggerTime = getNextTriggerTime(task, false);
  if (!triggerTime) return;

  const trigger = buildTimestampTrigger(triggerTime);
  const notification = buildNotification(task, task.id);

  await notifee.createTriggerNotification(notification, trigger);
}

/**
 * Reschedule a notification 15 minutes from now (snooze).
 */
export async function rescheduleAfterSnooze(task: Task): Promise<void> {
  // Dismiss current ringing reminder UI (if any), but keep future regular schedules.
  await cancelActiveReminder(task.id);

  const trigger = buildTimestampTrigger(Date.now() + 15 * 60 * 1000);

  const snoozeNotificationId = getSnoozeNotificationId(task.id);
  const notification = buildNotification(task, snoozeNotificationId);

  await notifee.createTriggerNotification(notification, trigger);

  // Keep the base daily/weekly/custom cadence on the original reminder time.
  await scheduleNextRegularReminder(task);
}

/**
 * Cancel a scheduled notification for a task.
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  const snoozeNotificationId = getSnoozeNotificationId(taskId);

  await notifee.cancelNotification(taskId);
  await notifee.cancelTriggerNotification(taskId);
  await notifee.cancelNotification(snoozeNotificationId);
  await notifee.cancelTriggerNotification(snoozeNotificationId);
  await dismissDisplayedRemindersForTask(taskId);
  await hideSystemReminderOverlay().catch(() => {});
}

/**
 * Cancel the active reminder notification for a task (if any).
 * Use after user action to dismiss the full-screen UI.
 */
export async function cancelActiveReminder(taskId: string): Promise<void> {
  const snoozeNotificationId = getSnoozeNotificationId(taskId);

  await dismissDisplayedRemindersForTask(taskId);
  await hideSystemReminderOverlay().catch(() => {});

  try {
    await notifee.cancelNotification(taskId);
  } catch {
    // Best-effort
  }
  try {
    await notifee.cancelNotification(snoozeNotificationId);
  } catch {
    // Best-effort
  }
  try {
    await notifee.cancelTriggerNotification(snoozeNotificationId);
  } catch {
    // Best-effort
  }
}

/**
 * Cancel all scheduled notifications (e.g., on sign out).
 */
export async function cancelAllReminders(): Promise<void> {
  await notifee.cancelAllNotifications();
  await notifee.cancelTriggerNotifications();
  await hideSystemReminderOverlay().catch(() => {});
}

/**
 * Display an immediate notification (for testing or instant reminders).
 */
export async function displayImmediateReminder(task: Task): Promise<void> {
  const notification = buildNotification(task, task.id);
  await notifee.displayNotification(notification);
}

/**
 * Resolve any reminder that fired while the app was backgrounded/killed.
 * Uses initial notification, pending background cache, or displayed notifications.
 */
export async function consumeInitialReminderTaskId(): Promise<string | null> {
  try {
    const initial = await notifee.getInitialNotification();
    const initialTaskId = initial?.notification?.data?.taskId as string | undefined;
    if (initialTaskId) return initialTaskId;
  } catch {
    // ignore
  }

  const pending = await consumePendingReminder();
  if (pending) return pending;

  try {
    const displayed = await notifee.getDisplayedNotifications();
    const match = displayed.find(
      (item) => !!item.notification?.data?.taskId,
    );
    const displayedTaskId = match?.notification?.data?.taskId as string | undefined;
    if (displayedTaskId) return displayedTaskId;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Reconcile scheduled notifications with current task list.
 * Call on app open to ensure all active tasks have correct notifications.
 */
export async function reconcileNotifications(tasks: Task[]): Promise<void> {
  // Cancel all existing trigger notifications
  await notifee.cancelTriggerNotifications();

  // Reschedule for all active tasks — first_unlock tasks are driven by the
  // native UserPresentReceiver, not by JS-scheduled notifications.
  for (const task of tasks) {
    if (task.isActive && task.triggerType !== 'first_unlock') {
      await scheduleTaskReminder(task);
    }
  }
}

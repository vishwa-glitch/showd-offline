import type { Task, TaskEvent } from '../types/task';

/**
 * Check for tasks that should be marked as missed.
 * A task is missed if:
 * 1. Its reminder time + (snoozeLimit * 15 min) grace period has passed today
 * 2. No event (done/struggled/missed) exists for today
 * 3. The task is NOT currently showing as an active reminder or queued
 *
 * @param skipTaskIds - Task IDs to skip (e.g. active/pending reminders)
 * Returns an array of taskIds that should be marked as missed.
 */
export function getTasksToMarkMissed(
  tasks: Task[],
  events: TaskEvent[],
  skipTaskIds?: ReadonlySet<string>,
): string[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const missedIds: string[] = [];

  for (const task of tasks) {
    if (!task.isActive) continue;

    // Skip tasks that are currently showing as reminders or queued
    if (skipTaskIds?.has(task.id)) continue;

    // Check if this task should have fired today
    if (!shouldFireToday(task, now)) continue;

    // Parse reminder time
    const [hours, minutes] = task.reminderTime.split(':').map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    // Add grace period: snoozeLimit * 15 minutes
    const graceMs = task.snoozeLimit * 15 * 60 * 1000;
    const deadline = new Date(reminderDate.getTime() + graceMs);

    // If we haven't passed the deadline yet, skip
    if (now < deadline) continue;

    // Skip tasks created after today's reminder time — the user just created
    // this task and hasn't had a chance to complete it yet
    // (e.g. task created at 10:46 PM with reminder at 8:00 AM)
    const taskCreatedAt = new Date(task.createdAt);
    if (taskCreatedAt >= reminderDate) continue;

    // Check if any terminal event exists for today
    const hasTerminalEvent = events.some(
      (e) =>
        e.taskId === task.id &&
        e.scheduledFor.startsWith(today) &&
        (e.status === 'done' || e.status === 'struggled' || e.status === 'missed' || e.status === 'in_progress')
    );

    if (!hasTerminalEvent) {
      missedIds.push(task.id);
    }
  }

  return missedIds;
}

/**
 * Determine if a task should fire today based on its frequency.
 */
function shouldFireToday(task: Task, now: Date): boolean {
  switch (task.frequency) {
    case 'daily':
      return true;

    case 'once': {
      if (!task.oneTimeDate) return true;
      const today = now.toISOString().split('T')[0];
      return task.oneTimeDate === today;
    }

    case 'weekly': {
      if (!task.frequencyDays?.length) return false;
      const currentDay = now.getDay();
      return task.frequencyDays.includes(currentDay);
    }

    case 'custom':
      // For custom intervals, we'd need the last fire date.
      // For now, assume it should fire daily as a safe default.
      return true;

    default:
      return false;
  }
}

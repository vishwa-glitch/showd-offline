import type { Task, TaskEvent } from '../types/task';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** Number of days in a given month (1-indexed month). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Day of week (0=Sun) for the 1st of the month. */
export function getMonthStartDay(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Format "February 2026". */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** Format a date as "Tuesday, Feb 10". */
export function formatDayHeader(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  const dayName = DAY_NAMES[d.getDay()];
  const monthShort = MONTH_NAMES[month].slice(0, 3);
  return `${dayName}, ${monthShort} ${day}`;
}

/** Get YYYY-MM-DD string for a given date. */
export function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** Check if an ISO timestamp falls on a given YYYY-MM-DD date. */
export function isOnDate(isoString: string, dateStr: string): boolean {
  return isoString.startsWith(dateStr);
}

export type DayStatus =
  | 'all_done'
  | 'partial'
  | 'all_missed'
  | 'struggled'
  | 'timer_done'
  | 'none';

/**
 * Determine the overall status for a day based on events.
 * Priority: struggled > timer_done > all_done > partial > all_missed > none
 */
export function getDayStatus(
  events: readonly TaskEvent[],
  tasks: readonly Task[],
  dateStr: string,
): DayStatus {
  // Get terminal events for this day (exclude snoozed and pending and in_progress)
  const dayEvents = events.filter(
    (e) =>
      isOnDate(e.scheduledFor, dateStr) &&
      (e.status === 'done' || e.status === 'missed' || e.status === 'struggled'),
  );

  if (dayEvents.length === 0) return 'none';

  const hasStruggled = dayEvents.some((e) => e.status === 'struggled');
  if (hasStruggled) return 'struggled';

  const doneEvents = dayEvents.filter((e) => e.status === 'done');
  const missedEvents = dayEvents.filter((e) => e.status === 'missed');

  const hasTimerDone = doneEvents.some((e) => e.timerCompleted === true);

  if (missedEvents.length === 0 && doneEvents.length > 0) {
    return hasTimerDone ? 'timer_done' : 'all_done';
  }

  if (doneEvents.length === 0 && missedEvents.length > 0) {
    return 'all_missed';
  }

  return 'partial';
}

/**
 * Calculate completion rate for a task (0-100).
 * Based on terminal events: done / (done + missed + struggled).
 */
export function getCompletionRate(events: readonly TaskEvent[], taskId: string): number {
  const terminal = events.filter(
    (e) =>
      e.taskId === taskId &&
      (e.status === 'done' || e.status === 'missed' || e.status === 'struggled'),
  );
  if (terminal.length === 0) return 0;
  const done = terminal.filter((e) => e.status === 'done').length;
  return Math.round((done / terminal.length) * 100);
}

/**
 * Get timed task statistics from events.
 */
export function getTimedTaskStats(
  events: readonly TaskEvent[],
  taskId: string,
): { avgActualSeconds: number; totalExtensions: number; completionCount: number } {
  const timedEvents = events.filter(
    (e) =>
      e.taskId === taskId &&
      e.status === 'done' &&
      e.actualDurationSeconds != null &&
      e.actualDurationSeconds > 0,
  );

  if (timedEvents.length === 0) {
    return { avgActualSeconds: 0, totalExtensions: 0, completionCount: 0 };
  }

  const totalSeconds = timedEvents.reduce(
    (sum, e) => sum + (e.actualDurationSeconds ?? 0),
    0,
  );
  const totalExt = timedEvents.reduce(
    (sum, e) => sum + (e.extensionsUsed ?? 0),
    0,
  );

  return {
    avgActualSeconds: Math.round(totalSeconds / timedEvents.length),
    totalExtensions: totalExt,
    completionCount: timedEvents.length,
  };
}

/**
 * Get events for a specific day, sorted by scheduledFor.
 */
export function getEventsForDay(events: readonly TaskEvent[], dateStr: string): TaskEvent[] {
  return events
    .filter((e) => isOnDate(e.scheduledFor, dateStr))
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

/**
 * Check if a date is today.
 */
export function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  );
}

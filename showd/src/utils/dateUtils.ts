import type { Task, TaskEvent } from '../types/task';
import { parseReminderTime } from './reminderTime';

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

type TerminalOutcome = 'done' | 'missed' | 'struggled';

export type CompletionRateWindow = '30_days' | 'all_time';

export interface TaskCompletionStats {
  done: number;
  missed: number;
  struggled: number;
  total: number;
  completionRate: number;
}

export interface TaskCompletionTrend {
  currentRate: number;
  previousRate: number;
  delta: number;
  direction: 'up' | 'down' | 'flat';
}

const DAY_MS = 24 * 60 * 60 * 1000;

function atLocalNoon(input: Date): Date {
  const d = new Date(input);
  d.setHours(12, 0, 0, 0);
  return d;
}

function addDays(input: Date, days: number): Date {
  const d = atLocalNoon(input);
  d.setDate(d.getDate() + days);
  return d;
}

function toEventDayKey(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function getDayIndex(input: Date): number {
  return Math.floor(
    Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()) / DAY_MS,
  );
}

function getFirstDueDate(task: Task): Date | null {
  if (!task.isActive || task.isPaused) return null;

  const parsed = parseReminderTime(task.reminderTime);
  if (!parsed) return null;

  const createdAt = new Date(task.createdAt);
  const createdDay = atLocalNoon(createdAt);
  const reminderOnCreatedDay = new Date(createdDay);
  reminderOnCreatedDay.setHours(parsed.hours, parsed.minutes, 0, 0);

  if (task.frequency === 'once') {
    if (task.oneTimeDate) {
      const target = new Date(task.oneTimeDate);
      if (Number.isNaN(target.getTime())) return null;
      target.setHours(parsed.hours, parsed.minutes, 0, 0);
      return target.getTime() > createdAt.getTime() ? atLocalNoon(target) : null;
    }
    return reminderOnCreatedDay.getTime() > createdAt.getTime() ? createdDay : null;
  }

  if (task.frequency === 'daily') {
    return reminderOnCreatedDay.getTime() > createdAt.getTime()
      ? createdDay
      : addDays(createdDay, 1);
  }

  if (task.frequency === 'weekly') {
    if (!task.frequencyDays?.length) return null;
    const currentDay = createdAt.getDay();
    const sortedDays = [...new Set(task.frequencyDays)].sort((a, b) => a - b);

    for (const day of sortedDays) {
      const diff = (day - currentDay + 7) % 7;
      const candidate = addDays(createdDay, diff);
      const candidateWithTime = new Date(candidate);
      candidateWithTime.setHours(parsed.hours, parsed.minutes, 0, 0);
      if (candidateWithTime.getTime() > createdAt.getTime()) {
        return candidate;
      }
    }

    const firstDay = sortedDays[0];
    const wrapDiff = ((firstDay - currentDay + 7) % 7) || 7;
    return addDays(createdDay, wrapDiff);
  }

  if (task.frequency === 'custom') {
    const intervalDays = Math.max(1, task.customIntervalDays ?? 1);
    return reminderOnCreatedDay.getTime() > createdAt.getTime()
      ? createdDay
      : addDays(createdDay, intervalDays);
  }

  return null;
}

function isDueOnDate(task: Task, firstDueDate: Date, date: Date): boolean {
  const firstDayIndex = getDayIndex(firstDueDate);
  const dateIndex = getDayIndex(date);
  if (dateIndex < firstDayIndex) return false;

  switch (task.frequency) {
    case 'once':
      return dateIndex === firstDayIndex;
    case 'daily':
      return true;
    case 'weekly':
      return !!task.frequencyDays?.includes(date.getDay());
    case 'custom': {
      const intervalDays = Math.max(1, task.customIntervalDays ?? 1);
      return (dateIndex - firstDayIndex) % intervalDays === 0;
    }
    default:
      return false;
  }
}

function getTerminalOutcomeByDay(
  events: readonly TaskEvent[],
  taskId: string,
): Map<string, TerminalOutcome> {
  const map = new Map<string, TerminalOutcome>();

  for (const event of events) {
    if (event.taskId !== taskId) continue;
    if (
      event.status !== 'done' &&
      event.status !== 'missed' &&
      event.status !== 'struggled'
    ) {
      continue;
    }

    const dayKey = event.scheduledFor.slice(0, 10);
    const existing = map.get(dayKey);

    if (event.status === 'done') {
      map.set(dayKey, 'done');
      continue;
    }

    if (event.status === 'struggled') {
      if (existing !== 'done') {
        map.set(dayKey, 'struggled');
      }
      continue;
    }

    if (!existing) {
      map.set(dayKey, 'missed');
    }
  }

  return map;
}

function getCompletionStatsForRange(
  task: Task,
  events: readonly TaskEvent[],
  startDate: Date,
  endDate: Date,
): TaskCompletionStats {
  const firstDueDate = getFirstDueDate(task);
  if (!firstDueDate) {
    return { done: 0, missed: 0, struggled: 0, total: 0, completionRate: 0 };
  }

  const rangeStart = atLocalNoon(startDate);
  const rangeEnd = atLocalNoon(endDate);
  if (rangeStart.getTime() > rangeEnd.getTime()) {
    return { done: 0, missed: 0, struggled: 0, total: 0, completionRate: 0 };
  }

  const outcomeByDay = getTerminalOutcomeByDay(events, task.id);

  let done = 0;
  let missed = 0;
  let struggled = 0;

  for (let cursor = rangeStart; cursor.getTime() <= rangeEnd.getTime(); cursor = addDays(cursor, 1)) {
    if (!isDueOnDate(task, firstDueDate, cursor)) continue;

    const outcome = outcomeByDay.get(toEventDayKey(cursor));
    if (outcome === 'done') done += 1;
    else if (outcome === 'missed') missed += 1;
    else if (outcome === 'struggled') struggled += 1;
  }

  const total = done + missed + struggled;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return { done, missed, struggled, total, completionRate };
}

export function getTaskCompletionStats(
  task: Task,
  events: readonly TaskEvent[],
  window: CompletionRateWindow,
): TaskCompletionStats {
  const today = atLocalNoon(new Date());
  if (window === 'all_time') {
    const firstDueDate = getFirstDueDate(task);
    if (!firstDueDate) {
      return { done: 0, missed: 0, struggled: 0, total: 0, completionRate: 0 };
    }
    return getCompletionStatsForRange(task, events, firstDueDate, today);
  }

  const thirtyDayStart = addDays(today, -29);
  return getCompletionStatsForRange(task, events, thirtyDayStart, today);
}

export function getTaskCompletionTrend(
  task: Task,
  events: readonly TaskEvent[],
): TaskCompletionTrend {
  const today = atLocalNoon(new Date());
  const currentStart = addDays(today, -29);
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -29);

  const current = getCompletionStatsForRange(task, events, currentStart, today);
  const previous = getCompletionStatsForRange(task, events, previousStart, previousEnd);

  const delta = current.completionRate - previous.completionRate;
  const direction: TaskCompletionTrend['direction'] =
    delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return {
    currentRate: current.completionRate,
    previousRate: previous.completionRate,
    delta,
    direction,
  };
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

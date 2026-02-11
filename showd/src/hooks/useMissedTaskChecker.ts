import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useTasks, useEvents, useMarkTaskMissed } from '../store/taskStore';
import { useActiveTaskId, usePendingReminders } from '../store/reminderStore';
import { useActiveTimerTaskId } from '../store/timerStore';
import { getTasksToMarkMissed } from '../services/missedTaskChecker';

const CHECK_INTERVAL_MS = 60_000; // 1 minute

/**
 * Hook that periodically checks for tasks that should be marked as missed.
 * Runs:
 * - Every minute while app is active
 * - When the app comes to the foreground
 *
 * Skips tasks that currently have an active reminder, are queued to show,
 * or have an active focus timer — prevents premature missed marking.
 */
export function useMissedTaskChecker() {
  const tasks = useTasks();
  const events = useEvents();
  const markTaskMissed = useMarkTaskMissed();
  const activeTaskId = useActiveTaskId();
  const pendingReminders = usePendingReminders();
  const activeTimerTaskId = useActiveTimerTaskId();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function checkMissed() {
      // Build set of task IDs to skip (active reminder, queued, or in-progress timer)
      const skipIds = new Set<string>();
      if (activeTaskId) skipIds.add(activeTaskId);
      if (activeTimerTaskId) skipIds.add(activeTimerTaskId);
      for (const id of pendingReminders) skipIds.add(id);

      const missedIds = getTasksToMarkMissed(tasks, events, skipIds);
      for (const taskId of missedIds) {
        markTaskMissed(taskId);
      }
    }

    // Check immediately
    checkMissed();

    // Check every minute
    intervalRef.current = setInterval(checkMissed, CHECK_INTERVAL_MS);

    // Check when app comes to foreground
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          checkMissed();
        }
      }
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [tasks, events, markTaskMissed, activeTaskId, pendingReminders, activeTimerTaskId]);
}

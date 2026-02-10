import { useEffect } from 'react';
import {
  useIsTimerActive,
  useTimerIsPaused,
  useTimerPausedAt,
  useAbandonTimer,
  useActiveTimerTaskId,
} from '../store/timerStore';
import { useMarkTaskMissed } from '../store/taskStore';
import { removeTimerNotification } from '../services/timerNotification';

const NUDGE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds

/**
 * Detects abandoned timers that have been paused too long.
 * - >10 min paused: could send a nudge notification (future)
 * - >30 min paused: auto-abandon and mark task missed
 */
export function useAbandonedTimerDetector() {
  const isActive = useIsTimerActive();
  const isPaused = useTimerIsPaused();
  const pausedAt = useTimerPausedAt();
  const activeTaskId = useActiveTimerTaskId();
  const abandonTimer = useAbandonTimer();
  const markTaskMissed = useMarkTaskMissed();

  useEffect(() => {
    if (!isActive || !isPaused || !pausedAt) return;

    const interval = setInterval(() => {
      const pausedMs = Date.now() - new Date(pausedAt).getTime();

      if (pausedMs >= ABANDON_THRESHOLD_MS) {
        // Auto-abandon after 30 minutes paused
        if (activeTaskId) {
          markTaskMissed(activeTaskId);
        }
        abandonTimer();
        removeTimerNotification().catch(() => {});
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isActive, isPaused, pausedAt, activeTaskId, abandonTimer, markTaskMissed]);
}

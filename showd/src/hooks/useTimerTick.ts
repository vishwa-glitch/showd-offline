import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  useIsTimerActive,
  useTimerIsPaused,
  useTickTimer,
  useActiveTimerTaskId,
  useTimerRemainingSeconds,
  useReconcileTimer,
} from '../store/timerStore';
import { useGetTaskById } from '../store/taskStore';
import {
  showTimerNotification,
  showPausedTimerNotification,
  removeTimerNotification,
} from '../services/timerNotification';

/**
 * Global timer tick hook. Must be called at App.tsx level.
 * - Drives the timer countdown via setInterval (for UI).
 * - Reconciles elapsed time when the app returns to foreground.
 * - Manages the persistent notification using Android's native
 *   chronometer (real-time countdown with no repeated updates).
 */
export function useTimerTick() {
  const isActive = useIsTimerActive();
  const isPaused = useTimerIsPaused();
  const tickTimer = useTickTimer();
  const reconcileTimer = useReconcileTimer();
  const activeTaskId = useActiveTimerTaskId();
  const remainingSeconds = useTimerRemainingSeconds();
  const getTaskById = useGetTaskById();

  // Counter to force notification refresh after foreground reconciliation
  const [reconcileCounter, setReconcileCounter] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  // Main tick interval — drives the UI countdown every second
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, tickTimer]);

  // Reconcile timer when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        reconcileTimer();
        setReconcileCounter((c) => c + 1);
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [reconcileTimer]);

  // Show / update notification only on timer state changes:
  // start, pause, resume, stop, or after foreground reconciliation.
  // The Android chronometer handles real-time display between updates.
  useEffect(() => {
    if (!isActive || !activeTaskId) {
      removeTimerNotification().catch(() => {});
      return;
    }

    const task = getTaskById(activeTaskId);
    if (!task) return;

    if (isPaused) {
      showPausedTimerNotification(task.name, remainingSeconds).catch(() => {});
    } else {
      showTimerNotification(task.name, remainingSeconds).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, activeTaskId, reconcileCounter]);
}

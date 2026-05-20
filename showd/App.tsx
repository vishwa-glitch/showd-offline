import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  initializeNotifications,
  registerForegroundHandler,
  registerBackgroundHandler,
  consumeInitialReminderTaskId,
  reconcileNotifications,
  cancelActiveReminder,
  rescheduleAfterSnooze,
  scheduleNextRegularReminder,
} from './src/services/notifications';
import {
  useTriggerReminder,
  useActiveTaskId,
  useDismissReminder,
} from './src/store/reminderStore';
import {
  useTasks,
  useEvents,
  useCompleteTask,
  useSnoozeTask,
  useGetTaskById,
  useStruggleTask,
} from './src/store/taskStore';
import {
  syncFirstUnlockTasks,
  consumePendingFirstUnlockTaskId,
} from './src/services/firstUnlockSync';
import { useMissedTaskChecker } from './src/hooks/useMissedTaskChecker';
import { useTimerTick } from './src/hooks/useTimerTick';
import { useAbandonedTimerDetector } from './src/hooks/useAbandonedTimerDetector';
import { useRefreshAllPermissions } from './src/store/permissionStore';
import { initializeTimerChannel } from './src/services/timerNotification';
import { useRecordAppOpen } from './src/store/ratingStore';
import {
  consumePendingSystemOverlayAction,
  hideSystemReminderOverlay,
} from './src/services/fullScreenIntentAccess';

// Register background notification handler at module level (required by Notifee)
registerBackgroundHandler();

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen might already be hidden
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const triggerReminder = useTriggerReminder();
  const activeReminderTaskId = useActiveTaskId();
  const dismissReminder = useDismissReminder();
  const completeTask = useCompleteTask();
  const snoozeTask = useSnoozeTask();
  const struggleTask = useStruggleTask();
  const getTaskById = useGetTaskById();
  const tasks = useTasks();
  const events = useEvents();
  const refreshPermissions = useRefreshAllPermissions();
  const recordAppOpen = useRecordAppOpen();
  const appStateRef = useRef(AppState.currentState);
  const hasReconciledRef = useRef(false);

  // Record app open for rating prompt logic
  useEffect(() => {
    recordAppOpen();
  }, [recordAppOpen]);

  // Check for missed tasks periodically
  useMissedTaskChecker();

  // Drive focus timer countdown globally
  useTimerTick();

  // Detect abandoned timers (paused >30 min)
  useAbandonedTimerDetector();

  const processPendingOverlayAction = React.useCallback(async (): Promise<string | null> => {
    const pending = await consumePendingSystemOverlayAction();
    if (!pending) return null;

    const { action, taskId } = pending;
    if (!taskId) return null;

    const task = getTaskById(taskId);
    if (!task) return taskId;

    if (action === 'open') {
      struggleTask(taskId, 'not_today', undefined);
      await cancelActiveReminder(taskId).catch(() => {});
      await scheduleNextRegularReminder(task).catch(() => {});
      if (activeReminderTaskId === taskId) dismissReminder();
      return taskId;
    }

    if (action === 'done') {
      completeTask(taskId);
      await cancelActiveReminder(taskId).catch(() => {});
      await scheduleNextRegularReminder(task).catch(() => {});
      if (activeReminderTaskId === taskId) dismissReminder();
      return taskId;
    }

    if (action === 'snooze') {
      const success = snoozeTask(taskId);
      if (success) {
        await rescheduleAfterSnooze(task).catch(() => {});
        if (activeReminderTaskId === taskId) dismissReminder();
        return taskId;
      }
      return null;
    }

    return null;
  }, [
    getTaskById,
    struggleTask,
    completeTask,
    activeReminderTaskId,
    dismissReminder,
    snoozeTask,
  ]);

  const syncReminderEntrypoints = React.useCallback(async () => {
    await hideSystemReminderOverlay().catch(() => {});

    const handledTaskId = await processPendingOverlayAction();
    const triggeredTaskId = await consumeInitialReminderTaskId();

    if (triggeredTaskId && triggeredTaskId !== handledTaskId) {
      triggerReminder(triggeredTaskId);
    }
  }, [processPendingOverlayAction, triggerReminder]);

  // Refresh permission states on mount and when app returns to foreground
  useEffect(() => {
    refreshPermissions();
    syncReminderEntrypoints().catch(() => {});

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshPermissions();
        syncReminderEntrypoints().catch(() => {});
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [refreshPermissions, syncReminderEntrypoints]);

  // Initialize notifications and set up foreground handler
  useEffect(() => {
    initializeNotifications().catch(() => {});
    initializeTimerChannel().catch(() => {});

    const unsubscribe = registerForegroundHandler((taskId: string) => {
      triggerReminder(taskId);
    });

    return unsubscribe;
  }, [triggerReminder]);

  // Reconcile scheduled reminders once after tasks hydrate
  useEffect(() => {
    if (hasReconciledRef.current) return;
    if (tasks.length === 0) return;
    hasReconciledRef.current = true;
    reconcileNotifications(tasks).catch(() => {});
  }, [tasks]);

  // Sync first-unlock tasks to native SharedPreferences on every change
  useEffect(() => {
    syncFirstUnlockTasks(tasks, events).catch(() => {});
  }, [tasks, events]);

  // Cold-start: check whether the native receiver fired a first-unlock reminder
  // while the app was killed and trigger the reminder UI if so
  useEffect(() => {
    let cancelled = false;
    consumePendingFirstUnlockTaskId().then((taskId) => {
      if (cancelled || !taskId) return;
      console.log('[FirstUnlock] cold-start: found pending taskId', taskId, '— triggering reminder');
      triggerReminder(taskId);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [triggerReminder]);

  // Hide splash screen once fonts are loaded (or if there's an error)
  useEffect(() => {
    async function hideSplash() {
      if (fontsLoaded || fontError) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignore errors - splash screen might already be hidden
        }
      }
    }
    hideSplash();
  }, [fontsLoaded, fontError]);

  // Show a loading state while fonts are loading
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If fonts failed to load, still render the app with system fonts
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF8F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});

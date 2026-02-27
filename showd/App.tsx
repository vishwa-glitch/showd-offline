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
} from './src/services/notifications';
import { useTriggerReminder } from './src/store/reminderStore';
import { useTasks } from './src/store/taskStore';
import { useMissedTaskChecker } from './src/hooks/useMissedTaskChecker';
import { useTimerTick } from './src/hooks/useTimerTick';
import { useAbandonedTimerDetector } from './src/hooks/useAbandonedTimerDetector';
import { useRefreshAllPermissions } from './src/store/permissionStore';
import { initializeTimerChannel } from './src/services/timerNotification';
import { useRecordAppOpen } from './src/store/ratingStore';

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
  const tasks = useTasks();
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

  // Refresh permission states on mount and when app returns to foreground
  useEffect(() => {
    refreshPermissions();
    consumeInitialReminderTaskId()
      .then((taskId) => {
        if (taskId) {
          triggerReminder(taskId);
        }
      })
      .catch(() => {});

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshPermissions();
        consumeInitialReminderTaskId()
          .then((taskId) => {
            if (taskId) {
              triggerReminder(taskId);
            }
          })
          .catch(() => {});
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [refreshPermissions, triggerReminder]);

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

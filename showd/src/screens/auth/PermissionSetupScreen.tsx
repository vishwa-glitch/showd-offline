import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import { PermissionItem } from '../../components/permissions/PermissionItem';
import { FullScreenIntentGuide } from '../../components/permissions/FullScreenIntentGuide';
import {
  requestNotificationPermission,
  requestExactAlarmPermission,
  requestBatteryOptimizationDisable,
  requestFullScreenIntentPermission,
  requestOverlayPermission,
  checkAllPermissions,
} from '../../services/permissions';

import {
  useSetOnboardingCompleted,
  useSetPermissionStatus,
} from '../../store/permissionStore';
import { useCompleteOnboarding } from '../../store/onboardingStore';
import type { PermissionSetupScreenProps } from '../../types/navigation';

type ItemStatus = 'pending' | 'granted' | 'denied';

export function PermissionSetupScreen({ navigation }: PermissionSetupScreenProps) {
  const [notifStatus, setNotifStatus] = useState<ItemStatus>('pending');
  const [alarmStatus, setAlarmStatus] = useState<ItemStatus>('pending');
  const [fullScreenStatus, setFullScreenStatus] = useState<ItemStatus>('pending');
  const [overlayStatus, setOverlayStatus] = useState<ItemStatus>('pending');
  const [batteryStatus, setBatteryStatus] = useState<ItemStatus>('pending');
  const [isRequesting, setIsRequesting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showFSIGuide, setShowFSIGuide] = useState(false);

  const setOnboardingCompleted = useSetOnboardingCompleted();
  const setPermissionStatus = useSetPermissionStatus();
  const completeOnboarding = useCompleteOnboarding();

  const isAndroid = Platform.OS === 'android';
  const needsFullScreenIntent = isAndroid && Number(Platform.Version) >= 34;

  const finishSetup = useCallback(() => {
    setOnboardingCompleted();
    completeOnboarding();
  }, [setOnboardingCompleted, completeOnboarding]);

  const handleEnableReminders = useCallback(async () => {
    setIsRequesting(true);

    // Step 1: Notifications (BLOCKING)
    const notifGranted = await requestNotificationPermission();
    setNotifStatus(notifGranted ? 'granted' : 'denied');
    setPermissionStatus('notificationsGranted', notifGranted);

    if (!notifGranted) {
      setIsRequesting(false);
      Alert.alert(
        'Notifications Required',
        'Showd needs notification permission to send you reminders. Without this, the app won\'t work at all.',
        [
          {
            text: 'Open Settings',
            onPress: async () => {
              const { Linking } = require('react-native');
              await Linking.openSettings();
            },
          },
          { text: 'Try Again', onPress: handleEnableReminders },
        ],
        { cancelable: false },
      );
      return;
    }

    // Step 2: Exact alarm (Android only, BLOCKING)
    if (isAndroid) {
      await requestExactAlarmPermission();
      // Re-check after user returns from settings
      const status = await checkAllPermissions();
      const alarmGranted = status.exactAlarm;
      setAlarmStatus(alarmGranted ? 'granted' : 'denied');
      setPermissionStatus('exactAlarmGranted', alarmGranted);

      if (!alarmGranted) {
        setIsRequesting(false);
        Alert.alert(
          'Exact Alarms Required',
          'Showd needs exact alarm permission to send reminders on time. Without this, reminders might be delayed by 15\u201330 minutes.',
          [
            {
              text: 'Open Settings',
              onPress: async () => {
                await requestExactAlarmPermission();
              },
            },
            { text: 'Try Again', onPress: handleEnableReminders },
          ],
          { cancelable: false },
        );
        return;
      }
    }

    // Step 3: Full-screen intent (Android 14+ only)
    if (needsFullScreenIntent) {
      setPermissionStatus('fullScreenIntentGranted', false);

      // Try the direct intent first — it takes the user straight to the toggle
      const opened = await requestFullScreenIntentPermission();

      if (!opened) {
        // Direct intent failed — show the brand-specific guide modal
        setFullScreenStatus('denied');
        setShowFSIGuide(true);
      } else {
        // User was sent to settings; when they come back, re-check
        setFullScreenStatus('denied');
        const recheckOnResume = () => {
          const sub = AppState.addEventListener('change', async (state) => {
            if (state === 'active') {
              sub.remove();
              const updated = await checkAllPermissions();
              const granted = updated.fullScreenIntent;
              setFullScreenStatus(granted ? 'granted' : 'denied');
              setPermissionStatus('fullScreenIntentGranted', granted);
              if (!granted) {
                // Still not granted — show the brand-specific guide
                setShowFSIGuide(true);
              }
            }
          });
        };
        recheckOnResume();
      }
    }

    // Step 4: Overlay / "Display over other apps" (Android only)
    // This allows full-screen reminders to appear even when the device is UNLOCKED
    if (isAndroid) {
      const preCheck = await checkAllPermissions();
      if (!preCheck.overlayPermission) {
        await requestOverlayPermission();
        // Re-check when user comes back
        const recheckOverlay = () => {
          const sub = AppState.addEventListener('change', async (nextState) => {
            if (nextState === 'active') {
              sub.remove();
              const updated = await checkAllPermissions();
              setOverlayStatus(updated.overlayPermission ? 'granted' : 'denied');
              setPermissionStatus('overlayGranted', updated.overlayPermission);
            }
          });
        };
        recheckOverlay();
      } else {
        setOverlayStatus('granted');
        setPermissionStatus('overlayGranted', true);
      }
    }

    // Step 5: Battery optimization (Android only, NOT blocking)
    if (isAndroid) {
      await requestBatteryOptimizationDisable();
      const status = await checkAllPermissions();
      setBatteryStatus(status.batteryOptimizationDisabled ? 'granted' : 'denied');
      setPermissionStatus('batteryOptimizationDisabled', status.batteryOptimizationDisabled);
    }

    setIsRequesting(false);
    setCompleted(true);
  }, [isAndroid, needsFullScreenIntent, setPermissionStatus]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      'Skip permissions?',
      'Without these permissions, your reminders may not show up or may be delayed.',
      [
        { text: 'Go back', style: 'cancel' },
        {
          text: 'Skip anyway',
          style: 'destructive',
          onPress: finishSetup,
        },
      ],
    );
  }, [finishSetup]);

  const handleContinue = useCallback(() => {
    finishSetup();
  }, [finishSetup]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Feather name="bell" size={32} color={Colors.primary} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>One important step</Text>
        <Text style={styles.subtext}>
          Showd needs a few permissions to interrupt you at the right time.
          Without these, your reminders might not show up.
        </Text>

        {/* Permission items */}
        <View style={styles.items}>
          <PermissionItem
            icon="smartphone"
            title="Show reminders on your screen"
            description="Even when your phone is locked"
            status={notifStatus}
          />
          {isAndroid && (
            <PermissionItem
              icon="clock"
              title="Fire at the exact time you set"
              description='Not "sometime soon"'
              status={alarmStatus}
            />
          )}
          {needsFullScreenIntent && (
            <>
              <PermissionItem
                icon="maximize"
                title="Take over your screen"
                description="So you can't ignore it"
                status={fullScreenStatus}
              />
            </>
          )}
          {isAndroid && (
            <PermissionItem
              icon="layers"
              title="Display over other apps"
              description="Show reminders even while using other apps"
              status={overlayStatus}
            />
          )}
          {isAndroid && (
            <PermissionItem
              icon="battery-charging"
              title="Stay active in the background"
              description="So your phone's battery saver doesn't kill reminders"
              status={batteryStatus}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        {!completed ? (
          <>
            <Button
              label="Enable Reminders"
              onPress={handleEnableReminders}
              loading={isRequesting}
              fullWidth
              style={styles.mainButton}
            />
            <Button
              label="I'll do this later"
              onPress={handleSkip}
              variant="text"
              textStyle={styles.skipText}
            />
            <Text style={styles.warningText}>
              Reminders may not work without these permissions
            </Text>
          </>
        ) : (
          <Button
            label="Continue"
            onPress={handleContinue}
            fullWidth
            style={styles.mainButton}
          />
        )}
      </View>
      {/* Full-Screen Intent Guide modal */}
      <FullScreenIntentGuide
        visible={showFSIGuide}
        onDismiss={() => setShowFSIGuide(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  heading: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontSize: 28,
  },
  subtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: Spacing['2xl'],
  },
  items: {
    width: '100%',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  mainButton: {
    minHeight: 56,
    borderRadius: BorderRadius.xl,
  },
  skipText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});

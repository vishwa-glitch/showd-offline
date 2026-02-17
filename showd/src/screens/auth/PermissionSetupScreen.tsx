import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import { PermissionItem } from '../../components/permissions/PermissionItem';
import {
  requestNotificationPermission,
  requestExactAlarmPermission,
  requestBatteryOptimizationDisable,
  requestFullScreenIntentPermission,
  checkAllPermissions,
} from '../../services/permissions';

import {
  useSetOnboardingCompleted,
  useSetPermissionStatus,
} from '../../store/permissionStore';
import { useSignIn } from '../../store/authStore';
import type { PermissionSetupScreenProps } from '../../types/navigation';

type ItemStatus = 'pending' | 'granted' | 'denied';

export function PermissionSetupScreen({ route }: PermissionSetupScreenProps) {
  const { user } = route.params;
  const [notifStatus, setNotifStatus] = useState<ItemStatus>('pending');
  const [alarmStatus, setAlarmStatus] = useState<ItemStatus>('pending');
  const [fullScreenStatus, setFullScreenStatus] = useState<ItemStatus>('pending');
  const [batteryStatus, setBatteryStatus] = useState<ItemStatus>('pending');
  const [isRequesting, setIsRequesting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const setOnboardingCompleted = useSetOnboardingCompleted();
  const setPermissionStatus = useSetPermissionStatus();
  const signIn = useSignIn();

  const isAndroid = Platform.OS === 'android';
  const needsFullScreenIntent = isAndroid && Number(Platform.Version) >= 34;

  const finishSetup = useCallback(() => {
    setOnboardingCompleted();
    signIn(user);
  }, [setOnboardingCompleted, signIn, user]);

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
          'Showd needs exact alarm permission to send reminders on time. Without this, reminders might be delayed by 15–30 minutes.',
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

    // Step 3: Full-screen intent (Android 14+ only, BLOCKING)
    if (needsFullScreenIntent) {
      await requestFullScreenIntentPermission();
      const status = await checkAllPermissions();
      const fsGranted = status.fullScreenIntent;
      setFullScreenStatus(fsGranted ? 'granted' : 'denied');
      setPermissionStatus('fullScreenIntentGranted', fsGranted);

      if (!fsGranted) {
        setIsRequesting(false);
        Alert.alert(
          'Full-Screen Permission Required',
          'Showd needs full-screen notification permission to show reminders like a phone call. Without this, reminders are just regular notifications you can swipe away.',
          [
            {
              text: 'Open Settings',
              onPress: async () => {
                await requestFullScreenIntentPermission();
              },
            },
            { text: 'Try Again', onPress: handleEnableReminders },
          ],
          { cancelable: false },
        );
        return;
      }
    }

    // Step 4: Battery optimization (Android only, NOT blocking)
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
            <PermissionItem
              icon="maximize"
              title="Take over your screen"
              description="So you can't ignore it"
              status={fullScreenStatus}
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

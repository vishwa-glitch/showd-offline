import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import {
  useNotificationsGranted,
  useExactAlarmGranted,
  useBatteryOptimizationDisabled,
  useFullScreenIntentGranted,
  useShouldShowBanner,
  useDismissBanner,
  useRefreshAllPermissions,
} from '../../store/permissionStore';
import {
  requestNotificationPermission,
  requestExactAlarmPermission,
  requestBatteryOptimizationDisable,
  requestFullScreenIntentPermission,
} from '../../services/permissions';

export function PermissionBanner() {
  const notificationsGranted = useNotificationsGranted();
  const exactAlarmGranted = useExactAlarmGranted();
  const batteryDisabled = useBatteryOptimizationDisabled();
  const fullScreenIntentGranted = useFullScreenIntentGranted();
  const shouldShowBanner = useShouldShowBanner();
  const dismissBanner = useDismissBanner();
  const refreshPermissions = useRefreshAllPermissions();

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const showBanner = shouldShowBanner();
  if (!showBanner) return null;

  // Determine which permission is most critical to fix
  let message = '';
  let onFix: () => void = () => Linking.openSettings();

  if (!notificationsGranted) {
    message = 'Notifications are off. Your reminders won\'t show up.';
    onFix = async () => {
      await requestNotificationPermission();
      refreshPermissions();
    };
  } else if (!exactAlarmGranted) {
    message = 'Exact alarms are disabled. Reminders may be delayed.';
    onFix = async () => {
      await requestExactAlarmPermission();
      refreshPermissions();
    };
  } else if (!batteryDisabled) {
    message = 'Battery saver may block your reminders.';
    onFix = async () => {
      await requestBatteryOptimizationDisable();
      refreshPermissions();
    };
  } else if (!fullScreenIntentGranted) {
    message = 'Full-screen reminders are off. Urgent reminders may be swipeable.';
    onFix = async () => {
      await requestFullScreenIntentPermission();
      refreshPermissions();
    };
  }

  // Multiple missing
  const missingCount =
    (!notificationsGranted ? 1 : 0) +
    (!exactAlarmGranted ? 1 : 0) +
    (!batteryDisabled ? 1 : 0) +
    (!fullScreenIntentGranted ? 1 : 0);

  if (missingCount > 1) {
    message = 'Some permissions are missing. Reminders may not work properly.';
    onFix = () => Linking.openSettings();
  }

  return (
    <View style={styles.container}>
      <Feather name="alert-triangle" size={18} color={Colors.snooze} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={onFix} style={styles.fixButton}>
        <Text style={styles.fixText}>Fix</Text>
        <Feather name="arrow-right" size={14} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={dismissBanner}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="x" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.snoozeLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  fixText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
});

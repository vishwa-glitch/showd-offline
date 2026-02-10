import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Button } from '../ui/Button';
import {
  requestNotificationPermission,
  requestBatteryOptimizationDisable,
} from '../../services/permissions';
import {
  useNotificationsGranted,
  useRefreshAllPermissions,
} from '../../store/permissionStore';

interface FailedReminderSheetProps {
  taskName: string;
  onDismiss: () => void;
}

export function FailedReminderSheet({ taskName, onDismiss }: FailedReminderSheetProps) {
  const notificationsGranted = useNotificationsGranted();
  const refreshPermissions = useRefreshAllPermissions();

  const handleFix = async () => {
    if (!notificationsGranted) {
      await requestNotificationPermission();
    } else {
      await requestBatteryOptimizationDisable();
    }
    await refreshPermissions();
    onDismiss();
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onDismiss} activeOpacity={1} />
      <Animated.View style={styles.sheet} entering={FadeInUp.duration(300)}>
        {/* Handle */}
        <View style={styles.handle} />

        <View style={styles.content}>
          <Feather name="alert-circle" size={32} color={Colors.snooze} />

          <Text style={styles.heading}>
            It looks like today's reminder for "{taskName}" didn't show up
          </Text>

          <Text style={styles.description}>
            This usually happens when your phone's battery saver blocks Showd.
          </Text>

          <Button
            label="Fix This Now"
            onPress={handleFix}
            fullWidth
            style={styles.fixButton}
          />

          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.notNow}>Not now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 500,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayMedium,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.base,
  },
  heading: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fixButton: {
    marginTop: Spacing.sm,
  },
  notNow: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textTertiary,
  },
});

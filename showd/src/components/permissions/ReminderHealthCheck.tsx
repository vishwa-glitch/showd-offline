import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import {
  useNotificationsGranted,
  useExactAlarmGranted,
  useBatteryOptimizationDisabled,
  useRefreshAllPermissions,
} from '../../store/permissionStore';
import {
  requestNotificationPermission,
  requestExactAlarmPermission,
  requestBatteryOptimizationDisable,
  openAutostartSettings,
} from '../../services/permissions';
import { isProblematicOEM, getOEMDisplayName } from '../../constants/oemConfig';

interface HealthRowProps {
  label: string;
  granted: boolean | null;
  onFix?: () => void;
  showFix?: boolean;
}

function HealthRow({ label, granted, onFix, showFix = true }: HealthRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {granted === true && (
          <>
            <Feather name="check-circle" size={16} color={Colors.success} />
            <Text style={[styles.rowStatus, { color: Colors.success }]}>Enabled</Text>
          </>
        )}
        {granted === false && (
          <>
            <Feather name="alert-triangle" size={16} color={Colors.snooze} />
            {showFix && onFix ? (
              <TouchableOpacity onPress={onFix} style={styles.fixLink}>
                <Text style={styles.fixLinkText}>Fix</Text>
                <Feather name="arrow-right" size={12} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.rowStatus, { color: Colors.snooze }]}>Not enabled</Text>
            )}
          </>
        )}
        {granted === null && (
          <>
            <Feather name="help-circle" size={16} color={Colors.textTertiary} />
            {onFix ? (
              <TouchableOpacity onPress={onFix} style={styles.fixLink}>
                <Text style={styles.fixLinkText}>Open Settings</Text>
                <Feather name="arrow-right" size={12} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.rowStatus, { color: Colors.textTertiary }]}>Check manually</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export function ReminderHealthCheck() {
  const notificationsGranted = useNotificationsGranted();
  const exactAlarmGranted = useExactAlarmGranted();
  const batteryDisabled = useBatteryOptimizationDisabled();
  const refreshPermissions = useRefreshAllPermissions();

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const isAndroid = Platform.OS === 'android';

  return (
    <View style={styles.container}>
      <HealthRow
        label="Notifications"
        granted={notificationsGranted}
        onFix={async () => {
          await requestNotificationPermission();
          refreshPermissions();
        }}
      />
      <View style={styles.divider} />

      {isAndroid && (
        <>
          <HealthRow
            label="Exact Alarms"
            granted={exactAlarmGranted}
            onFix={async () => {
              await requestExactAlarmPermission();
              refreshPermissions();
            }}
          />
          <View style={styles.divider} />

          <HealthRow
            label="Battery Optimization"
            granted={batteryDisabled}
            onFix={async () => {
              await requestBatteryOptimizationDisable();
              refreshPermissions();
            }}
          />

          {isProblematicOEM() && (
            <>
              <View style={styles.divider} />
              <HealthRow
                label={`${getOEMDisplayName()} Autostart`}
                granted={null}
                onFix={async () => {
                  await openAutostartSettings();
                  refreshPermissions();
                }}
              />
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowStatus: {
    ...Typography.bodySmall,
  },
  fixLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  fixLinkText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
  },
});

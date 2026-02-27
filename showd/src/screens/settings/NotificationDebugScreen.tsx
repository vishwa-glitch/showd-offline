import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';
import * as Device from 'expo-device';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import type { NotificationDebugScreenProps } from '../../types/navigation';
import { REMINDER_CHANNEL_ID, BUILT_IN_SOUNDS, DEFAULT_SOUND_ID, getSoundName } from '../../utils/sounds';
import { getSelectedSoundId } from '../../store/soundStore';
import { playSound, stopSound, previewSound } from '../../services/soundPlayer';
import {
  displayImmediateReminder,
  scheduleTaskReminder,
  cancelAllReminders,
  reconcileNotifications,
  consumeInitialReminderTaskId,
} from '../../services/notifications';
import { checkAllPermissions } from '../../services/permissions';
import { canUseFullScreenIntent } from '../../services/fullScreenIntentAccess';
import type { Task } from '../../types/task';

/* ────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────── */

function formatDateTime(value?: number) {
  if (!value) return 'n/a';
  const d = new Date(value);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function minutesUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return 'OVERDUE';
  const mins = Math.ceil(diff / 60_000);
  return mins < 60 ? `in ${mins}m` : `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

type StatusColor = 'green' | 'red' | 'orange' | 'gray';

function StatusDot({ color }: { color: StatusColor }) {
  const bg =
    color === 'green'
      ? Colors.success
      : color === 'red'
        ? Colors.missed
        : color === 'orange'
          ? Colors.snooze
          : Colors.textTertiary;
  return <View style={[styles.statusDot, { backgroundColor: bg }]} />;
}

/* ────────────────────────────────────
 *  Fake task for testing
 * ──────────────────────────────────── */

function makeFakeTask(): Task {
  return {
    id: 'debug-test-task',
    userId: 'local',
    name: '🔔 Debug Test Reminder',
    description: 'This is a fake task created for testing full-screen reminders.',
    category: 'other',
    reminderTime: '08:00',
    frequency: 'daily',
    snoozeLimit: 3,
    durationMinutes: 5,
    requirePhotoProof: false,
    isActive: true,
    isPaused: false,
    currentStreak: 0,
    longestStreak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* ────────────────────────────────────
 *  Types
 * ──────────────────────────────────── */

type ScheduledReminder = {
  id: string;
  taskId: string;
  triggerTimestamp?: number;
  isSnooze: boolean;
};

type PermissionSnapshot = {
  notifications: boolean;
  exactAlarm: boolean;
  batteryOptimizationDisabled: boolean;
  overlayPermission: boolean;
  fullScreenIntent: boolean;
};

/* ────────────────────────────────────
 *  Component
 * ──────────────────────────────────── */

export function NotificationDebugScreen({ navigation }: NotificationDebugScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [permissions, setPermissions] = useState<PermissionSnapshot | null>(null);
  const [channelInfo, setChannelInfo] = useState<string>('loading…');
  const [notifeeSettings, setNotifeeSettings] = useState<string>('loading…');
  const [fullScreenAccess, setFullScreenAccess] = useState<boolean | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [selectedSoundId, setSelectedSoundId] = useState(getSelectedSoundId());
  const [actionLog, setActionLog] = useState<string[]>([]);

  // ── Logging helper ──
  const log = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 40));
  }, []);

  // ── Refresh all data ──
  const refresh = useCallback(async () => {
    setIsLoading(true);
    log('🔄 Refreshing all debug data…');
    try {
      // 1 · Permissions
      const perms = await checkAllPermissions();
      setPermissions(perms);

      // 2 · Notifee Settings raw dump
      const settings = await notifee.getNotificationSettings();
      setNotifeeSettings(JSON.stringify(settings, null, 2));

      // 3 · Channel
      try {
        const channel = await notifee.getChannel(REMINDER_CHANNEL_ID);
        setChannelInfo(
          channel
            ? JSON.stringify(
              {
                id: channel.id,
                name: channel.name,
                importance: channel.importance,
                sound: channel.sound,
                vibration: channel.vibration,
                bypassDnd: channel.bypassDnd,
                blocked: (channel as any).blocked,
              },
              null,
              2,
            )
            : 'Channel NOT FOUND',
        );
      } catch {
        setChannelInfo('ERROR reading channel');
      }

      // 4 · Full-screen intent access
      const fsa = await canUseFullScreenIntent();
      setFullScreenAccess(fsa);

      // 5 · Scheduled (trigger) notifications
      const triggers = await notifee.getTriggerNotifications();
      const reminders: ScheduledReminder[] = triggers
        .map((item) => {
          const id = typeof item.notification?.id === 'string' ? item.notification.id : '';
          const taskIdValue = item.notification?.data?.taskId;
          const taskId = typeof taskIdValue === 'string' ? taskIdValue : '';
          const triggerTimestamp =
            typeof (item.trigger as { timestamp?: unknown })?.timestamp === 'number'
              ? (item.trigger as { timestamp: number }).timestamp
              : undefined;
          return { id, taskId, triggerTimestamp, isSnooze: id.endsWith(':snooze') };
        })
        .filter((item) => item.taskId.length > 0)
        .sort(
          (a, b) =>
            (a.triggerTimestamp ?? Number.MAX_SAFE_INTEGER) -
            (b.triggerTimestamp ?? Number.MAX_SAFE_INTEGER),
        );
      setScheduledReminders(reminders);

      // 6 · Currently displayed notifications
      const displayed = await notifee.getDisplayedNotifications();
      setDisplayedCount(displayed.length);

      // 7 · Device info
      setDeviceInfo(
        [
          `Brand: ${Device.brand ?? 'unknown'}`,
          `Model: ${Device.modelName ?? 'unknown'}`,
          `OS: Android ${Platform.Version}`,
          `API: ${Platform.Version}`,
          `Device: ${Device.deviceName ?? 'unknown'}`,
        ].join('\n'),
      );

      // 8 · Sound selection
      setSelectedSoundId(getSelectedSoundId());

      setNow(Date.now());
      log('✅ Refresh complete');
    } catch (err) {
      log(`❌ Refresh failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [log]);

  useEffect(() => {
    refresh().catch(() => { });
  }, [refresh]);

  // ── Quick Actions ──

  const handleFireImmediate = async () => {
    log('🔔 Firing IMMEDIATE notification (full-screen)…');
    try {
      const fakeTask = makeFakeTask();
      await displayImmediateReminder(fakeTask);
      log('✅ Immediate notification sent');
    } catch (err) {
      log(`❌ Immediate failed: ${err}`);
    }
  };

  const handleSchedule30s = async () => {
    log('⏱ Scheduling test reminder in 30s…');
    try {
      const fakeTask = makeFakeTask();
      const futureTime = new Date(Date.now() + 30_000);
      const hours = futureTime.getHours().toString().padStart(2, '0');
      const mins = futureTime.getMinutes().toString().padStart(2, '0');
      fakeTask.reminderTime = `${hours}:${mins}`;
      fakeTask.frequency = 'once';
      fakeTask.oneTimeDate = futureTime.toISOString().split('T')[0];
      await scheduleTaskReminder(fakeTask);
      log(`✅ Scheduled for ${futureTime.toLocaleTimeString()} — lock your phone to test!`);
      await refresh();
    } catch (err) {
      log(`❌ Schedule failed: ${err}`);
    }
  };

  const handleSchedule2m = async () => {
    log('⏱ Scheduling test reminder in 2 min…');
    try {
      const fakeTask = makeFakeTask();
      const futureTime = new Date(Date.now() + 2 * 60_000);
      const hours = futureTime.getHours().toString().padStart(2, '0');
      const mins = futureTime.getMinutes().toString().padStart(2, '0');
      fakeTask.reminderTime = `${hours}:${mins}`;
      fakeTask.frequency = 'once';
      fakeTask.oneTimeDate = futureTime.toISOString().split('T')[0];
      await scheduleTaskReminder(fakeTask);
      log(`✅ Scheduled for ${futureTime.toLocaleTimeString()} — lock your phone to test!`);
      await refresh();
    } catch (err) {
      log(`❌ Schedule failed: ${err}`);
    }
  };

  const handleCancelAll = async () => {
    Alert.alert('Cancel All', 'Cancel all scheduled and displayed notifications?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          log('🗑 Cancelling all notifications…');
          try {
            await cancelAllReminders();
            log('✅ All notifications cancelled');
            await refresh();
          } catch (err) {
            log(`❌ Cancel failed: ${err}`);
          }
        },
      },
    ]);
  };

  const handleTestSound = async () => {
    const soundId = getSelectedSoundId();
    log(`🔊 Playing sound: ${getSoundName(soundId)} (3s preview)…`);
    try {
      await previewSound(soundId, 3000);
      log('✅ Sound played');
    } catch (err) {
      log(`❌ Sound failed: ${err}`);
    }
  };

  const handleTestSoundLoop = async () => {
    const soundId = getSelectedSoundId();
    log(`🔊 Playing sound on LOOP: ${getSoundName(soundId)} — tap Stop to end`);
    try {
      await playSound(soundId, true);
    } catch (err) {
      log(`❌ Sound loop failed: ${err}`);
    }
  };

  const handleStopSound = async () => {
    log('🔇 Stopping sound…');
    await stopSound();
    log('✅ Sound stopped');
  };

  const handleCheckInitialNotification = async () => {
    log('🔍 Checking initial notification…');
    try {
      const taskId = await consumeInitialReminderTaskId();
      if (taskId) {
        log(`✅ Initial notification found! taskId: ${taskId}`);
      } else {
        log('ℹ️ No initial notification found (expected if app was opened normally)');
      }
    } catch (err) {
      log(`❌ Check failed: ${err}`);
    }
  };

  const handleOpenNotifSettings = async () => {
    log('⚙️ Opening notification settings…');
    try {
      await notifee.openNotificationSettings();
    } catch {
      log('❌ Could not open notification settings');
    }
  };

  const handleOpenAlarmSettings = async () => {
    log('⏰ Opening alarm permission settings…');
    try {
      await notifee.openAlarmPermissionSettings();
    } catch {
      log('❌ Could not open alarm settings');
    }
  };

  const handleOpenBatterySettings = async () => {
    log('🔋 Opening power manager settings…');
    try {
      await notifee.openPowerManagerSettings();
    } catch {
      log('❌ Could not open power manager settings');
    }
  };

  const handleClearLog = () => setActionLog([]);

  // ── Section renderers ──

  const renderPermissionRow = (label: string, granted: boolean) => (
    <View style={styles.row} key={label}>
      <StatusDot color={granted ? 'green' : 'red'} />
      <Text style={[styles.label, { flex: 1 }]}>{label}</Text>
      <Text style={[styles.value, { color: granted ? Colors.success : Colors.missed }]}>
        {granted ? 'GRANTED' : 'DENIED'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>🔧 Debug Dashboard</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* ── 1 · Permissions ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Permissions Status</Text>
          {permissions ? (
            <>
              {renderPermissionRow('Notifications', permissions.notifications)}
              {renderPermissionRow('Exact Alarm', permissions.exactAlarm)}
              {renderPermissionRow('Battery Unrestricted', permissions.batteryOptimizationDisabled)}
              {renderPermissionRow('Full-Screen Intent', permissions.fullScreenIntent)}
              {renderPermissionRow('Overlay / Display Over', permissions.overlayPermission)}
            </>
          ) : (
            <Text style={styles.monoText}>Loading…</Text>
          )}
          <View style={styles.quickButtonRow}>
            <TouchableOpacity style={styles.miniButton} onPress={handleOpenNotifSettings}>
              <Text style={styles.miniButtonText}>Notif Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniButton} onPress={handleOpenAlarmSettings}>
              <Text style={styles.miniButtonText}>Alarm Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniButton} onPress={handleOpenBatterySettings}>
              <Text style={styles.miniButtonText}>Battery Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2 · Device Info ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Device Info</Text>
          <Text style={styles.monoText}>{deviceInfo || 'Loading…'}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>F/S Intent API Check</Text>
            <StatusDot color={fullScreenAccess === true ? 'green' : fullScreenAccess === false ? 'red' : 'gray'} />
            <Text style={styles.value}>
              {fullScreenAccess === null ? '…' : fullScreenAccess ? 'AVAILABLE' : 'BLOCKED'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Current Time</Text>
            <Text style={styles.value}>{formatDateTime(now)}</Text>
          </View>
        </View>

        {/* ── 3 · Notification Channel ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📢 Reminder Channel</Text>
          <Text style={styles.monoText}>{channelInfo}</Text>
        </View>

        {/* ── 4 · Scheduled Reminders ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏰ Scheduled Reminders</Text>
          <Text style={styles.value}>{scheduledReminders.length} pending trigger(s)</Text>
          {scheduledReminders.length === 0 ? (
            <Text style={styles.monoText}>No reminder triggers pending.</Text>
          ) : (
            scheduledReminders.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.scheduleRow}>
                <View style={styles.scheduleHeader}>
                  <StatusDot
                    color={
                      item.triggerTimestamp && item.triggerTimestamp <= Date.now()
                        ? 'red'
                        : 'green'
                    }
                  />
                  <Text style={styles.schedulePrimary}>
                    {formatDateTime(item.triggerTimestamp)}
                  </Text>
                  <Text style={styles.scheduleBadge}>
                    {item.triggerTimestamp ? minutesUntil(item.triggerTimestamp) : ''}
                  </Text>
                </View>
                <Text style={styles.scheduleSecondary}>
                  {item.isSnooze ? '💤 Snooze' : '🔔 Base'} · taskId: {item.taskId.slice(0, 12)}…
                </Text>
              </View>
            ))
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Displayed now</Text>
            <Text style={styles.value}>{displayedCount}</Text>
          </View>
        </View>

        {/* ── 5 · Sound Testing ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔊 Sound Testing</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Selected Sound</Text>
            <Text style={styles.value}>{getSoundName(selectedSoundId)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sound ID</Text>
            <Text style={styles.monoText}>{selectedSoundId}</Text>
          </View>
          <View style={styles.quickButtonRow}>
            <TouchableOpacity style={styles.miniButton} onPress={handleTestSound}>
              <Text style={styles.miniButtonText}>▶ Preview 3s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniButton} onPress={handleTestSoundLoop}>
              <Text style={styles.miniButtonText}>🔁 Loop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniButton, { backgroundColor: Colors.missed + '20' }]} onPress={handleStopSound}>
              <Text style={[styles.miniButtonText, { color: Colors.missed }]}>⏹ Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 6 · Quick Test Actions ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚀 Notification Actions</Text>
          <Text style={styles.hintText}>
            Use these to verify full-screen reminders. Lock the phone after scheduling.
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.primary }]} onPress={handleFireImmediate}>
              <Feather name="zap" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Fire Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.inProgress }]} onPress={handleSchedule30s}>
              <Feather name="clock" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>In 30s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.snooze }]} onPress={handleSchedule2m}>
              <Feather name="clock" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>In 2 min</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.missed }]} onPress={handleCancelAll}>
              <Feather name="x-circle" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Cancel All</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.struggling, alignSelf: 'stretch', marginTop: Spacing.sm }]} onPress={handleCheckInitialNotification}>
            <Feather name="search" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Check Initial Notification</Text>
          </TouchableOpacity>
        </View>

        {/* ── 7 · Refresh ── */}
        <View style={styles.card}>
          <Button
            label={isLoading ? 'Refreshing…' : '🔄 Refresh All Data'}
            onPress={refresh}
            fullWidth
          />
        </View>

        {/* ── 8 · Raw Notifee Settings ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 Raw Notifee Settings</Text>
          <Text style={styles.monoText}>{notifeeSettings}</Text>
        </View>

        {/* ── 9 · Action Log ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>📝 Action Log</Text>
            <TouchableOpacity onPress={handleClearLog}>
              <Text style={styles.clearLogText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {actionLog.length === 0 ? (
            <Text style={styles.monoText}>No actions logged yet.</Text>
          ) : (
            actionLog.map((entry, i) => (
              <Text key={`log-${i}`} style={styles.logEntry}>
                {entry}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────
 *  Styles
 * ──────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },

  // ── Cards ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  cardTitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    fontFamily: FontFamily.semiBold,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  // ── Rows ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontFamily: FontFamily.semiBold,
  },
  monoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 11,
    lineHeight: 18,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },

  // ── Status Dot ──
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },

  // ── Schedule Rows ──
  scheduleRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  schedulePrimary: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  scheduleBadge: {
    ...Typography.caption,
    color: Colors.inProgress,
    fontFamily: FontFamily.semiBold,
  },
  scheduleSecondary: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    paddingLeft: Spacing.lg,
  },

  // ── Quick Buttons ──
  quickButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  miniButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniButtonText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
  },

  // ── Action Grid ──
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flex: 1,
    minWidth: '45%',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
  },

  // ── Log ──
  logEntry: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    color: Colors.textSecondary,
    lineHeight: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingVertical: 3,
  },
  clearLogText: {
    ...Typography.caption,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
});

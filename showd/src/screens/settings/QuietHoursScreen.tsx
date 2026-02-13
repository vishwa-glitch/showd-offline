import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useUser, useUpdateProfile } from '../../store/authStore';
import type { QuietHoursScreenProps } from '../../types/navigation';

function parseTime(timeStr: string | undefined, fallbackHour: number): Date {
  const d = new Date();
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(fallbackHour, 0, 0, 0);
  }
  return d;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function toTimeString(date: Date): string {
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function QuietHoursScreen({ navigation }: QuietHoursScreenProps) {
  const user = useUser();
  const updateProfile = useUpdateProfile();

  const [enabled, setEnabled] = useState(user?.quietHoursEnabled ?? false);
  const [startDate, setStartDate] = useState(() => parseTime(user?.quietHoursStart, 23));
  const [endDate, setEndDate] = useState(() => parseTime(user?.quietHoursEnd, 7));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startStr = toTimeString(startDate);
  const endStr = toTimeString(endDate);
  const sameTime = startStr === endStr;

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    updateProfile({
      quietHoursEnabled: value,
      ...(value ? { quietHoursStart: startStr, quietHoursEnd: endStr } : {}),
    });
    Alert.alert('Updated', value ? 'Quiet hours enabled' : 'Quiet hours disabled');
  };

  const handleStartChange = (_event: unknown, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      const newStart = toTimeString(selectedDate);
      if (newStart === endStr) return;
      updateProfile({ quietHoursStart: newStart });
    }
  };

  const handleEndChange = (_event: unknown, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      const newEnd = toTimeString(selectedDate);
      if (newEnd === startStr) return;
      updateProfile({ quietHoursEnd: newEnd });
    }
  };

  // Calculate quiet hours span for visual bar
  const startHour = startDate.getHours() + startDate.getMinutes() / 60;
  const endHour = endDate.getHours() + endDate.getMinutes() / 60;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Quiet Hours</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Explanation card */}
        <View style={styles.card}>
          <Text style={styles.cardBody}>
            {"During quiet hours, reminders won\u2019t take over your screen. They\u2019ll still be logged and you can respond when quiet hours end."}
          </Text>
          <Text style={styles.cardCaption}>
            {"Missed tasks during quiet hours won\u2019t notify your witness until quiet hours end."}
          </Text>
        </View>

        {/* Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Quiet Hours</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor={Colors.surface}
          />
        </View>

        {enabled && (
          <>
            {/* Time pickers */}
            <View style={styles.timeSection}>
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeLabel}>From</Text>
                <Text style={styles.timeValue}>{formatTime(startDate)}</Text>
              </TouchableOpacity>

              <View style={styles.timeDivider} />

              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeLabel}>Until</Text>
                <Text style={styles.timeValue}>{formatTime(endDate)}</Text>
              </TouchableOpacity>
            </View>

            {sameTime && (
              <Text style={styles.errorText}>
                Start and end time can't be the same
              </Text>
            )}

            {/* Visual timeline bar */}
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabel}>12AM</Text>
                <Text style={styles.timelineLabel}>6AM</Text>
                <Text style={styles.timelineLabel}>12PM</Text>
                <Text style={styles.timelineLabel}>6PM</Text>
                <Text style={styles.timelineLabel}>12AM</Text>
              </View>
              <View style={styles.timelineBar}>
                {/* Quiet hours overlay — handles wrapping past midnight */}
                {startHour <= endHour ? (
                  <View
                    style={[
                      styles.timelineQuiet,
                      { left: `${(startHour / 24) * 100}%`, width: `${((endHour - startHour) / 24) * 100}%` },
                    ]}
                  />
                ) : (
                  <>
                    <View
                      style={[
                        styles.timelineQuiet,
                        { left: `${(startHour / 24) * 100}%`, right: 0, width: undefined },
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineQuiet,
                        { left: 0, width: `${(endHour / 24) * 100}%` },
                      ]}
                    />
                  </>
                )}
              </View>
              <View style={styles.timelineLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.textTertiary }]} />
                  <Text style={styles.legendText}>Quiet</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
                  <Text style={styles.legendText}>Active</Text>
                </View>
              </View>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="time"
                is24Hour={false}
                onChange={handleStartChange}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="time"
                is24Hour={false}
                onChange={handleEndChange}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  cardBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  cardCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  toggleLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  timeSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    minHeight: 48,
  },
  timeLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  timeValue: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: Colors.primary,
  },
  timeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.base,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.missed,
    marginBottom: Spacing.md,
  },
  timelineContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  timelineBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineQuiet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Colors.textTertiary,
    borderRadius: 6,
  },
  timelineLegend: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';

interface QuickStatsRowProps {
  completedToday: number;
  totalToday: number;
  currentStreak: number;
}

export function QuickStatsRow({
  completedToday,
  totalToday,
  currentStreak,
}: QuickStatsRowProps) {
  const completionRate =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Feather name="check-circle" size={16} color={Colors.success} />
        <Text style={styles.statValue}>
          {completedToday}/{totalToday}
        </Text>
        <Text style={styles.statLabel}>Done today</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.stat}>
        <Feather name="zap" size={16} color={Colors.snooze} />
        <Text style={styles.statValue}>{currentStreak}</Text>
        <Text style={styles.statLabel}>Day streak</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.stat}>
        <Feather name="trending-up" size={16} color={Colors.primary} />
        <Text style={styles.statValue}>{completionRate}%</Text>
        <Text style={styles.statLabel}>Rate</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
});

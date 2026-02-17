import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Card } from '../../components/ui/Card';
import { CalendarGrid } from '../../components/progress/CalendarGrid';
import { DayDetail } from '../../components/progress/DayDetail';
import { useTasks, useEvents, useCompletedTodayCount } from '../../store/taskStore';
import { useIsPro, useIsTrialActive } from '../../store/subscriptionStore';
import {
  formatMonthYear,
  getCompletionRate,
  getTimedTaskStats,
} from '../../utils/dateUtils';
import { formatDuration } from '../../utils/extensionTiers';
import type { Task, TaskEvent } from '../../types/task';

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  medication: 'heart',
  exercise: 'activity',
  work: 'briefcase',
  self_care: 'sun',
  habit: 'star',
  other: 'grid',
};

const CATEGORY_COLORS: Record<string, string> = {
  medication: Colors.categoryMedication,
  exercise: Colors.categoryExercise,
  work: Colors.categoryWork,
  self_care: Colors.categorySelfCare,
  habit: Colors.categoryHabit,
  other: Colors.categoryOther,
};

export function ProgressScreen({ navigation }: any) {
  const tasks = useTasks();
  const events = useEvents();
  const completedCount = useCompletedTodayCount();
  const isPro = useIsPro();
  const isTrialActive = useIsTrialActive();
  const hasFullProgress = isPro || isTrialActive;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  const maxStreak = tasks.reduce((max, t) => Math.max(max, t.currentStreak), 0);
  const longestStreak = tasks.reduce((max, t) => Math.max(max, t.longestStreak), 0);

  // Free users can only see the current month (7-day rolling window)
  const goToPrevMonth = () => {
    if (!hasFullProgress) {
      navigation?.navigate?.('Paywall', { reason: 'full_progress' });
      return;
    }
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  // Sort tasks by completion rate (highest first)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const rateA = getCompletionRate(events, a.id);
      const rateB = getCompletionRate(events, b.id);
      return rateB - rateA;
    });
  }, [tasks, events]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Progress</Text>

        {/* Streak Banner */}
        <View style={styles.streakBanner}>
          <View style={styles.streakIcon}>
            <Feather name="zap" size={28} color={Colors.snooze} />
          </View>
          <Text style={styles.streakValue}>
            {maxStreak > 0 ? `${maxStreak} Day Streak` : 'No active streak'}
          </Text>
          <Text style={styles.streakSubtext}>
            {maxStreak > 0
              ? 'Keep it going! Complete all tasks today.'
              : 'Start a streak by completing all tasks today'}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Active tasks</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Done today</Text>
          </Card>
        </View>

        {/* Monthly Calendar */}
        <View style={styles.section}>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={goToPrevMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {formatMonthYear(selectedYear, selectedMonth)}
            </Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-right" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Card>
            <CalendarGrid
              year={selectedYear}
              month={selectedMonth}
              events={events}
              tasks={tasks}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </Card>
        </View>

        {/* Free user upgrade hint */}
        {!hasFullProgress && (
          <TouchableOpacity
            style={styles.upgradeHint}
            onPress={() => navigation?.navigate?.('Paywall', { reason: 'full_progress' })}
          >
            <Feather name="lock" size={14} color={Colors.proGold} />
            <Text style={styles.upgradeHintText}>
              Viewing last 7 days. Go Pro for full history.
            </Text>
            <Feather name="chevron-right" size={14} color={Colors.proGold} />
          </TouchableOpacity>
        )}

        {/* Day Detail */}
        {selectedDay !== null && (
          <View style={styles.section}>
            <DayDetail
              year={selectedYear}
              month={selectedMonth}
              day={selectedDay}
              events={events}
              tasks={tasks}
            />
          </View>
        )}

        {/* Task Completion Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Completion Rates</Text>
          {sortedTasks.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                Create tasks to start tracking completion rates.
              </Text>
            </Card>
          ) : (
            sortedTasks.map((task) => (
              <TaskRateCard key={task.id} task={task} events={events} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskRateCard({ task, events }: { task: Task; events: readonly TaskEvent[] }) {
  const rate = getCompletionRate(events, task.id);
  const categoryIcon = CATEGORY_ICONS[task.category] || 'grid';
  const categoryColor = CATEGORY_COLORS[task.category] || Colors.textTertiary;

  const isTimed = (task.durationMinutes ?? 0) > 0;
  const timedStats = isTimed ? getTimedTaskStats(events, task.id) : null;

  return (
    <Card style={styles.taskRateCard}>
      <View style={styles.taskRateRow}>
        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]}>
          <Feather name={categoryIcon} size={14} color={Colors.surface} />
        </View>
        <Text style={styles.taskRateName} numberOfLines={1}>
          {task.name}
        </Text>
        <Text style={styles.taskRateValue}>{rate}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, rate)}%` },
          ]}
        />
      </View>
      {isTimed && timedStats && timedStats.completionCount > 0 && (
        <Text style={styles.timedStatsText}>
          Avg: {Math.round(timedStats.avgActualSeconds / 60)} min
          (target: {task.durationMinutes})
          {timedStats.totalExtensions > 0
            ? ` · ${timedStats.totalExtensions} extension${timedStats.totalExtensions > 1 ? 's' : ''} total`
            : ''}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  streakBanner: {
    backgroundColor: Colors.snoozeLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  streakValue: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  streakSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statNumber: {
    ...Typography.heading1,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  monthTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  taskRateCard: {
    marginBottom: Spacing.sm,
  },
  taskRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  categoryDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskRateName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  taskRateValue: {
    ...Typography.heading3,
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  timedStatsText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.proGoldLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  upgradeHintText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});

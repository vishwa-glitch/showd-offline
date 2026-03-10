import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import {
  useShouldShowRatingPrompt,
  useMarkRatingPromptShown,
  useMarkAppRated,
} from '../../store/ratingStore';
import type { RatingTriggerResult } from '../../store/ratingStore';
import { RatingPromptSheet } from '../../components/ui/RatingPromptSheet';
import {
  formatMonthYear,
  getTaskCompletionStats,
  getTaskCompletionTrend,
  getTimedTaskStats,
  type CompletionRateWindow,
  type TaskCompletionStats,
  type TaskCompletionTrend,
} from '../../utils/dateUtils';
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

export function ProgressScreen() {
  const tasks = useTasks();
  const events = useEvents();
  const completedCount = useCompletedTodayCount();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [completionWindow, setCompletionWindow] = useState<CompletionRateWindow>('30_days');

  // Rating prompt state
  const shouldShowRatingPrompt = useShouldShowRatingPrompt();
  const markRatingPromptShown = useMarkRatingPromptShown();
  const markAppRated = useMarkAppRated();
  const [ratingTrigger, setRatingTrigger] = useState<RatingTriggerResult | null>(null);
  const ratingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for rating prompt after a short delay on mount
  // Progress screen is a reflective moment — user is reviewing their stats
  useEffect(() => {
    ratingDelayRef.current = setTimeout(() => {
      const result = shouldShowRatingPrompt();
      if (result.shouldShow) {
        setRatingTrigger(result);
        markRatingPromptShown();
      }
      ratingDelayRef.current = null;
    }, 1500);

    return () => {
      if (ratingDelayRef.current) {
        clearTimeout(ratingDelayRef.current);
      }
    };
  }, [shouldShowRatingPrompt, markRatingPromptShown]);

  const handleRate = useCallback(() => {
    markAppRated();
    setRatingTrigger(null);
  }, [markAppRated]);

  const handleDismissRating = useCallback(() => {
    setRatingTrigger(null);
  }, []);

  const maxStreak = tasks.reduce((max, t) => Math.max(max, t.currentStreak), 0);
  const longestStreak = tasks.reduce((max, t) => Math.max(max, t.longestStreak), 0);

  const rateDataByTask = useMemo(() => {
    const map = new Map<string, { stats: TaskCompletionStats; trend: TaskCompletionTrend }>();
    for (const task of tasks) {
      map.set(task.id, {
        stats: getTaskCompletionStats(task, events, completionWindow),
        trend: getTaskCompletionTrend(task, events),
      });
    }
    return map;
  }, [tasks, events, completionWindow]);

  const goToPrevMonth = () => {
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
      const statsA = rateDataByTask.get(a.id)?.stats;
      const statsB = rateDataByTask.get(b.id)?.stats;
      const rateA = statsA?.completionRate ?? 0;
      const rateB = statsB?.completionRate ?? 0;
      return rateB - rateA;
    });
  }, [tasks, rateDataByTask]);

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
            <Feather name="zap" size={22} color={Colors.snooze} />
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
          <View style={styles.windowToggle}>
            <TouchableOpacity
              style={[
                styles.windowToggleButton,
                completionWindow === '30_days' && styles.windowToggleButtonActive,
              ]}
              onPress={() => setCompletionWindow('30_days')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.windowToggleText,
                  completionWindow === '30_days' && styles.windowToggleTextActive,
                ]}
              >
                30 days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.windowToggleButton,
                completionWindow === 'all_time' && styles.windowToggleButtonActive,
              ]}
              onPress={() => setCompletionWindow('all_time')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.windowToggleText,
                  completionWindow === 'all_time' && styles.windowToggleTextActive,
                ]}
              >
                All-time
              </Text>
            </TouchableOpacity>
          </View>
          {sortedTasks.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                Create tasks to start tracking completion rates.
              </Text>
            </Card>
          ) : (
            sortedTasks.map((task) => {
              const rateData = rateDataByTask.get(task.id);
              if (!rateData) return null;
              return (
                <TaskRateCard
                  key={task.id}
                  task={task}
                  events={events}
                  stats={rateData.stats}
                  trend={rateData.trend}
                />
              );
            })
          )}
        </View>
      </ScrollView>
      {/* Rating Prompt Sheet */}
      {ratingTrigger && (
        <RatingPromptSheet
          trigger={ratingTrigger}
          onRate={handleRate}
          onDismiss={handleDismissRating}
        />
      )}
    </SafeAreaView>
  );
}

function TaskRateCard({
  task,
  events,
  stats,
  trend,
}: {
  task: Task;
  events: readonly TaskEvent[];
  stats: TaskCompletionStats;
  trend: TaskCompletionTrend;
}) {
  const hasEnoughData = stats.total >= 3;
  const categoryIcon = CATEGORY_ICONS[task.category] || 'grid';
  const categoryColor = CATEGORY_COLORS[task.category] || Colors.textTertiary;

  const isTimed = (task.durationMinutes ?? 0) > 0;
  const timedStats = isTimed ? getTimedTaskStats(events, task.id) : null;
  const trendIcon = trend.direction === 'up'
    ? 'trending-up'
    : trend.direction === 'down'
      ? 'trending-down'
      : 'minus';
  const trendColor = trend.direction === 'up'
    ? Colors.success
    : trend.direction === 'down'
      ? Colors.missed
      : Colors.textTertiary;

  return (
    <Card style={styles.taskRateCard}>
      <View style={styles.taskRateRow}>
        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]}>
          <Feather name={categoryIcon} size={14} color={Colors.surface} />
        </View>
        <Text style={styles.taskRateName} numberOfLines={1}>
          {task.name}
        </Text>
        {hasEnoughData ? (
          <Text style={styles.taskRateValue}>
            {stats.completionRate}% ({stats.done}/{stats.total})
          </Text>
        ) : (
          <Text style={styles.taskRateInsufficient}>Not enough data yet</Text>
        )}
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, stats.completionRate)}%` },
          ]}
        />
      </View>
      <View style={styles.taskMetaRow}>
        <Text style={styles.taskMetaText}>
          Struggled {stats.struggled} {stats.struggled === 1 ? 'time' : 'times'}
        </Text>
        <View style={styles.trendRow}>
          <Feather name={trendIcon} size={12} color={trendColor} />
          <Text style={[styles.taskMetaText, { color: trendColor }]}>
            {`${trend.delta > 0 ? '+' : ''}${trend.delta}% vs prev 30d`}
          </Text>
        </View>
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
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  streakValue: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  streakSubtext: {
    ...Typography.caption,
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
  windowToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    padding: 2,
    marginBottom: Spacing.md,
  },
  windowToggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  windowToggleButtonActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  windowToggleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  windowToggleTextActive: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.semiBold,
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
  taskRateInsufficient: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontFamily: FontFamily.medium,
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
  taskMetaRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskMetaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timedStatsText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useUser } from '../../store/authStore';
import { useEvents, useTodayTasks, useCompletedTodayCount, useCompleteTask } from '../../store/taskStore';
import { useTriggerReminder } from '../../store/reminderStore';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskEmptyState } from '../../components/task/TaskEmptyState';
import { QuickStatsRow } from '../../components/task/QuickStatsRow';
import { PermissionBanner } from '../../components/permissions/PermissionBanner';
import { ActiveTimerBar } from '../../components/timer/ActiveTimerBar';
import { TrialBanner } from '../../components/subscription/TrialBanner';
import { useIsTimerActive, useActiveTimerTaskId, useTimerRemainingSeconds } from '../../store/timerStore';
import type { TodayScreenProps } from '../../types/navigation';
import type { Task } from '../../types/task';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function TodayScreen({ navigation }: TodayScreenProps) {
  const user = useUser();
  const tasks = useTodayTasks();
  const completedCount = useCompletedTodayCount();
  const events = useEvents();
  const completeTask = useCompleteTask();
  const triggerReminder = useTriggerReminder();
  const timerActive = useIsTimerActive();
  const activeTimerTaskId = useActiveTimerTaskId();
  const timerRemainingSeconds = useTimerRemainingSeconds();

  // Long-press a task to test its reminder screen
  const handleDevTestReminder = (taskId: string) => {
    console.log('[TodayScreen] Long-press detected for task:', taskId);
    Alert.alert('Test Reminder', 'Trigger a test reminder for this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Trigger',
        onPress: () => {
          console.log('[TodayScreen] Triggering reminder for:', taskId);
          triggerReminder(taskId);
        }
      },
    ]);
  };

  const isTaskCompletedToday = (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return events.some(
      (e) => e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'done'
    );
  };

  const maxStreak = tasks.reduce((max, t) => Math.max(max, t.currentStreak), 0);

  const navigateToCreate = () => {
    navigation.navigate('CreateTask');
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      onLongPress={() => handleDevTestReminder(item.id)}
      delayLongPress={800}
      activeOpacity={1}
    >
      <TaskCard
        task={item}
        isCompleted={isTaskCompletedToday(item.id)}
        isInProgress={activeTimerTaskId === item.id}
        timerRemainingSeconds={activeTimerTaskId === item.id ? timerRemainingSeconds : undefined}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
        onComplete={() => completeTask(item.id)}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Trial Banner */}
      <TrialBanner onGoProPress={() => navigation.navigate('Paywall', { reason: 'pro_required' })} />

      {/* Permission Banner */}
      <PermissionBanner />

      {/* Active Timer Bar */}
      {timerActive && <ActiveTimerBar />}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.name || 'there'}
          </Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
      </View>

      {tasks.length > 0 ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <QuickStatsRow
              completedToday={completedCount}
              totalToday={tasks.length}
              currentStreak={maxStreak}
            />
          }
          ListHeaderComponentStyle={styles.statsRow}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      ) : (
        <TaskEmptyState onCreateTask={navigateToCreate} />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={navigateToCreate}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={28} color={Colors.surface} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  greeting: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statsRow: {
    marginBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    zIndex: 10,
  },
});

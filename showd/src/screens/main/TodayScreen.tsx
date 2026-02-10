import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useUser, useIsGuest } from '../../store/authStore';
import { useEvents, useTodayTasks, useCompletedTodayCount, useCompleteTask } from '../../store/taskStore';
import { useTriggerReminder } from '../../store/reminderStore';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskEmptyState } from '../../components/task/TaskEmptyState';
import { QuickStatsRow } from '../../components/task/QuickStatsRow';
import { PermissionBanner } from '../../components/permissions/PermissionBanner';
import { ActiveTimerBar } from '../../components/timer/ActiveTimerBar';
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
  const isGuest = useIsGuest();
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
      {/* Guest Banner */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <Feather name="info" size={14} color={Colors.primary} />
          <Text style={styles.guestText}>
            Sign up to save your progress and add real witnesses
          </Text>
        </View>
      )}

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
        {/* DEV TEST BUTTON - Remove in production */}
        <TouchableOpacity
          style={{
            backgroundColor: '#FF4D6A',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => {
            console.log('[TodayScreen] Test button pressed!');
            console.log('[TodayScreen] Tasks available:', tasks.length);
            if (tasks.length > 0) {
              console.log('[TodayScreen] Triggering reminder for first task:', tasks[0].id);
              triggerReminder(tasks[0].id);
            } else {
              console.log('[TodayScreen] No tasks! Creating mock trigger...');
              // Even without a real task, let's set a mock ID to see if overlay renders
              triggerReminder('mock-test-task-id');
            }
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🧪 Test Reminder</Text>
        </TouchableOpacity>
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
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  guestText: {
    ...Typography.caption,
    color: Colors.primary,
    flex: 1,
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

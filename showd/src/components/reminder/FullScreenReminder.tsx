import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { TASK_CATEGORIES } from '../../types/task';
import type { Task } from '../../types/task';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import {
  useActiveTaskId,
  usePendingReminders,
  useDismissReminder,
  useSnoozeReminder,
  useOpenStrugglingSheet,
  useGetSnoozeCount,
  useShowSuccess,
} from '../../store/reminderStore';
import { useGetTaskById, useCompleteTask, useSnoozeTask, useAddEvent } from '../../store/taskStore';
import { useStartTimer } from '../../store/timerStore';
import { rescheduleAfterSnooze } from '../../services/notifications';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenReminderProps {
  task: Task;
}

export function FullScreenReminder({ task }: FullScreenReminderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const pendingReminders = usePendingReminders();
  const dismissReminder = useDismissReminder();
  const snoozeReminder = useSnoozeReminder();
  const openStrugglingSheet = useOpenStrugglingSheet();
  const getSnoozeCount = useGetSnoozeCount();
  const showSuccess = useShowSuccess();
  const completeTask = useCompleteTask();
  const snoozeTask = useSnoozeTask();
  const addEvent = useAddEvent();
  const startTimer = useStartTimer();

  const isTimedTask = (task.durationMinutes ?? 0) > 0;

  const snoozeCount = getSnoozeCount(task.id);
  const snoozesRemaining = task.snoozeLimit - snoozeCount;
  const totalReminders = pendingReminders.length + 1;

  // Pulse animation for witness circle
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Intercept Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  const category = TASK_CATEGORIES.find((c) => c.key === task.category);
  const categoryIcon = (category?.icon || 'circle') as keyof typeof Feather.glyphMap;

  const witnessName =
    task.accountabilityType === 'real'
      ? task.witnessName
      : task.accountabilityType === 'personal'
        ? task.personalWitnessName
        : null;

  const witnessLine =
    task.accountabilityType === 'real' && task.witnessName
      ? `${task.witnessName} is counting on you`
      : task.accountabilityType === 'personal' && task.personalWitnessName
        ? `Don't let ${task.personalWitnessName} down`
        : 'Time to show up for yourself';

  const initials = witnessName
    ? witnessName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  const handleDone = useCallback(async () => {
    const streak = completeTask(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(streak);
    dismissReminder();
  }, [task.id, completeTask, showSuccess, dismissReminder]);

  const handleStart = useCallback(() => {
    // Create an in_progress event
    const now = new Date().toISOString();
    const eventId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    addEvent({
      taskId: task.id,
      scheduledFor: now,
      status: 'in_progress',
      respondedAt: now,
      snoozeCount: 0,
      startedAt: now,
      originalDurationMinutes: task.durationMinutes,
    });
    // Start the global timer
    startTimer(task.id, eventId, task.durationMinutes!);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dismissReminder();
    // Navigate to focus timer screen
    navigation.navigate('FocusTimer', { taskId: task.id, taskEventId: eventId });
  }, [task, addEvent, startTimer, dismissReminder, navigation]);

  const handleSnooze = useCallback(async () => {
    const success = snoozeTask(task.id);
    if (!success) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    snoozeReminder(task.id);
    rescheduleAfterSnooze(task).catch(() => {});
  }, [task, snoozeTask, snoozeReminder]);

  const handleStruggling = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openStrugglingSheet();
  }, [openStrugglingSheet]);

  return (
    <View style={styles.container}>
      {/* Category icon */}
      <View style={styles.categoryIcon}>
        <Feather name={categoryIcon} size={48} color="rgba(255,255,255,0.9)" />
      </View>

      {/* Witness circle with pulse */}
      <Animated.View style={[styles.witnessCircle, pulseStyle]}>
        {initials ? (
          <Text style={styles.witnessInitials}>{initials}</Text>
        ) : (
          <Feather name="user" size={40} color="rgba(255,255,255,0.7)" />
        )}
      </Animated.View>

      {/* Task name */}
      <Text style={styles.taskName} numberOfLines={3}>
        {task.name}
      </Text>

      {/* Witness / motivation line */}
      <Text style={styles.witnessLine}>{witnessLine}</Text>

      {/* Snooze count indicator */}
      {snoozeCount > 0 && (
        <Text style={styles.snoozeIndicator}>
          Snooze {snoozeCount} of {task.snoozeLimit} used
        </Text>
      )}

      {/* Queue indicator */}
      {totalReminders > 1 && (
        <Text style={styles.queueIndicator}>
          1 of {totalReminders} reminders
        </Text>
      )}

      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          {isTimedTask ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Feather name="play" size={22} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start ({task.durationMinutes}m)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Feather name="check" size={22} color="#FFFFFF" />
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {snoozesRemaining > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={[styles.actionButton, styles.snoozeButton]}
              onPress={handleSnooze}
              activeOpacity={0.8}
            >
              <Feather name="clock" size={22} color="#FFFFFF" />
              <Text style={styles.buttonText}>
                Snooze 15min{snoozeCount > 0 ? ` (${snoozesRemaining} left)` : ''}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(snoozesRemaining > 0 ? 300 : 200).springify()}>
          <TouchableOpacity
            style={[styles.actionButton, styles.strugglingButton]}
            onPress={handleStruggling}
            activeOpacity={0.8}
          >
            <Feather name="cloud" size={22} color="#FFFFFF" />
            <Text style={styles.buttonText}>Struggling Today</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Showd branding */}
      <Text style={styles.branding}>Showd.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(15, 10, 20, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    zIndex: 999,
  },
  categoryIcon: {
    marginBottom: Spacing.xl,
  },
  witnessCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 77, 106, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 77, 106, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  witnessInitials: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: '#FFFFFF',
  },
  taskName: {
    ...Typography.reminderTask,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  witnessLine: {
    ...Typography.reminderWitness,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  snoozeIndicator: {
    ...Typography.caption,
    color: Colors.snooze,
    marginBottom: Spacing.sm,
  },
  queueIndicator: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: Spacing.lg,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    width: '100%',
  },
  doneButton: {
    backgroundColor: Colors.success,
  },
  startButton: {
    backgroundColor: Colors.inProgress,
  },
  snoozeButton: {
    backgroundColor: Colors.snooze,
  },
  strugglingButton: {
    backgroundColor: Colors.struggling,
  },
  buttonText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 18,
  },
  branding: {
    position: 'absolute',
    bottom: 48,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.1)',
  },
});

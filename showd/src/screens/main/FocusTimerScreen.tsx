import React, { useCallback, useEffect } from 'react';
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { TASK_CATEGORIES } from '../../types/task';
import { CircularProgress } from '../../components/timer/CircularProgress';
import { formatCountdown, formatDuration } from '../../utils/extensionTiers';
import {
  useActiveTimerTaskId,
  useTimerRemainingSeconds,
  useTimerIsPaused,
  useTimerProgress,
  useTimerStartedAt,
  useTimerDurationSeconds,
  useTimerExtensionsUsed,
  usePauseTimer,
  useResumeTimer,
  useCompleteTimer,
} from '../../store/timerStore';
import { useGetTaskById, useCompleteTask } from '../../store/taskStore';
import { useOpenStrugglingSheet, useShowSuccess } from '../../store/reminderStore';
import type { FocusTimerScreenProps } from '../../types/navigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FocusTimerScreen({ navigation, route }: FocusTimerScreenProps) {
  const activeTaskId = useActiveTimerTaskId();
  const remainingSeconds = useTimerRemainingSeconds();
  const isPaused = useTimerIsPaused();
  const progress = useTimerProgress();
  const startedAt = useTimerStartedAt();
  const durationSeconds = useTimerDurationSeconds();
  const extensionsUsed = useTimerExtensionsUsed();
  const pauseTimer = usePauseTimer();
  const resumeTimer = useResumeTimer();
  const completeTimerAction = useCompleteTimer();
  const getTaskById = useGetTaskById();
  const completeTask = useCompleteTask();
  const openStrugglingSheet = useOpenStrugglingSheet();
  const showSuccess = useShowSuccess();

  const task = activeTaskId ? getTaskById(activeTaskId) : null;

  // If no active timer, go back
  useEffect(() => {
    if (!activeTaskId) {
      navigation.goBack();
    }
  }, [activeTaskId, navigation]);

  // Allow back navigation (timer continues in background)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPaused, pauseTimer, resumeTimer]);

  const handleDone = useCallback(() => {
    if (!task) return;
    const streak = completeTask(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(streak);
    completeTimerAction();
    navigation.goBack();
  }, [task, completeTask, showSuccess, completeTimerAction, navigation]);

  const handleStruggling = useCallback(() => {
    pauseTimer();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openStrugglingSheet();
  }, [pauseTimer, openStrugglingSheet]);

  if (!task) return null;

  const category = TASK_CATEGORIES.find((c) => c.key === task.category);
  const categoryIcon = (category?.icon || 'circle') as keyof typeof Feather.glyphMap;

  const startTimeStr = startedAt
    ? new Date(startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  const targetStr = formatDuration(durationSeconds);

  return (
    <View style={styles.container}>
      {/* Back arrow */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Feather name="arrow-left" size={24} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* Category + task name */}
      <View style={styles.categoryIcon}>
        <Feather name={categoryIcon} size={36} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.taskName} numberOfLines={2}>
        {task.name}
      </Text>

      {/* Circular progress + countdown */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.timerSection}>
        <CircularProgress
          progress={progress}
          size={220}
          strokeWidth={8}
          color={isPaused ? Colors.textTertiary : Colors.primary}
        >
          <View style={styles.timerContent}>
            <Text style={styles.timerDisplay}>{formatCountdown(remainingSeconds)}</Text>
            <Text style={styles.timerLabel}>
              {isPaused ? 'PAUSED' : 'remaining'}
            </Text>
          </View>
        </CircularProgress>
      </Animated.View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Started at {startTimeStr}</Text>
        <Text style={styles.infoDot}>·</Text>
        <Text style={styles.infoText}>Target: {targetStr}</Text>
      </View>

      {extensionsUsed > 0 && (
        <Text style={styles.extensionInfo}>
          +{extensionsUsed} extension{extensionsUsed > 1 ? 's' : ''} used
        </Text>
      )}

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.pauseButton]}
            onPress={handlePauseResume}
            activeOpacity={0.8}
          >
            <Feather
              name={isPaused ? 'play' : 'pause'}
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={styles.pauseButtonText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton]}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Feather name="check" size={20} color="#FFFFFF" />
            <Text style={styles.doneButtonText}>I'm Done</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleStruggling} style={styles.strugglingLink}>
          <Feather name="cloud" size={16} color={Colors.struggling} />
          <Text style={styles.strugglingText}>Struggling</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 20, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: Spacing.xl,
    zIndex: 10,
  },
  categoryIcon: {
    marginBottom: Spacing.md,
  },
  taskName: {
    ...Typography.heading2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  timerSection: {
    marginBottom: Spacing['2xl'],
  },
  timerContent: {
    alignItems: 'center',
  },
  timerDisplay: {
    ...Typography.timerDisplay,
    color: '#FFFFFF',
  },
  timerLabel: {
    ...Typography.timerLabel,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  infoDot: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  extensionInfo: {
    ...Typography.caption,
    color: Colors.snooze,
    marginBottom: Spacing.sm,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  pauseButton: {
    backgroundColor: Colors.surfaceSecondary,
  },
  pauseButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  doneButton: {
    backgroundColor: Colors.success,
  },
  doneButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  strugglingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  strugglingText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.struggling,
  },
});

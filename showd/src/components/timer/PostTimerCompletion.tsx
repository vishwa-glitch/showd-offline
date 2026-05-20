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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { TASK_CATEGORIES } from '../../types/task';
import { getExtensionTier, formatDuration } from '../../utils/extensionTiers';
import {
  useCompletedTimerTaskId,
  useCompletedDurationSeconds,
  useTimerExtensionsUsed,
  useActiveTimerEventId,
  useActiveTimerTaskId,
  useTimerTotalPausedSeconds,
  useTimerStartedAt,
  useCompleteTimer,
  useAbandonTimer,
  useExtendTimer,
  useDismissPostTimer,
} from '../../store/timerStore';
import {
  useGetTaskById,
  useCompleteTask,
  useStruggleTask,
} from '../../store/taskStore';
import {
  useShowSuccess,
} from '../../store/reminderStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PostTimerCompletion() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const completedTaskId = useCompletedTimerTaskId();
  const completedDurationSeconds = useCompletedDurationSeconds();
  const extensionsUsed = useTimerExtensionsUsed();
  const activeEventId = useActiveTimerEventId();
  const activeTaskId = useActiveTimerTaskId();
  const completeTimer = useCompleteTimer();
  const abandonTimer = useAbandonTimer();
  const extendTimer = useExtendTimer();
  const getTaskById = useGetTaskById();
  const completeTask = useCompleteTask();
  const struggleTask = useStruggleTask();
  const showSuccess = useShowSuccess();

  const task = completedTaskId ? getTaskById(completedTaskId) : null;

  // Intercept Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  if (!task) return null;

  const originalDuration = task.durationMinutes || 30;
  const tier = getExtensionTier(originalDuration);
  const canExtend = extensionsUsed < tier.maxExtensions;

  const category = TASK_CATEGORIES.find((c) => c.key === task.category);
  const categoryIcon = (category?.icon || 'circle') as keyof typeof Feather.glyphMap;

  const handleDone = useCallback(() => {
    const streak = completeTask(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(streak);
    completeTimer();
  }, [task.id, completeTask, showSuccess, completeTimer]);

  const handleExtend = useCallback((minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    extendTimer(minutes);
    // Navigate to focus timer with existing task
    if (activeTaskId && activeEventId) {
      navigation.navigate('FocusTimer', {
        taskId: activeTaskId,
        taskEventId: activeEventId,
      });
    }
  }, [extendTimer, activeTaskId, activeEventId, navigation]);

  const handleNotToday = useCallback(() => {
    if (!task) return;
    struggleTask(task.id, 'not_today', undefined);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    abandonTimer();
  }, [task, struggleTask, abandonTimer]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Category icon */}
      <View style={styles.categoryIcon}>
        <Feather name={categoryIcon} size={48} color="rgba(255,255,255,0.9)" />
      </View>

      {/* Time's Up heading */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <Feather name="clock" size={32} color={Colors.snooze} style={styles.clockIcon} />
        <Text style={styles.heading}>Time's Up!</Text>
      </Animated.View>

      {/* Duration completed */}
      <Text style={styles.durationText}>
        {formatDuration(completedDurationSeconds)} completed
      </Text>

      {/* Motivation line */}
      <Text style={styles.motivationLine}>You showed up for yourself</Text>

      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        {/* Done */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton]}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Feather name="check" size={22} color="#FFFFFF" />
            <Text style={styles.buttonText}>Done — I finished</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Extend */}
        {canExtend && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={[styles.actionButton, styles.extendButton]}>
              <Text style={styles.extendLabel}>Need more time</Text>
              <View style={styles.extendChipsRow}>
                {tier.options.map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={styles.extendChip}
                    onPress={() => handleExtend(mins)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.extendChipText}>+{mins}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.extendCount}>
                Extension {extensionsUsed + 1} of {tier.maxExtensions}
              </Text>
            </View>
          </Animated.View>
        )}

        {!canExtend && (
          <Text style={styles.noExtensions}>No more extensions available</Text>
        )}

        {/* Not today */}
        <Animated.View entering={FadeInDown.delay(canExtend ? 400 : 300).springify()}>
          <TouchableOpacity
            style={styles.notTodayLink}
            onPress={handleNotToday}
            activeOpacity={0.8}
          >
            <Text style={styles.notTodayText}>Not today</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Branding */}
      <Text style={[styles.branding, { bottom: Spacing['4xl'] + insets.bottom }]}>
        Showd.
      </Text>
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
  clockIcon: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  heading: {
    ...Typography.heading1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  durationText: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  motivationLine: {
    ...Typography.reminderWitness,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  buttonsContainer: {
    width: '100%',
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
  extendButton: {
    backgroundColor: Colors.snooze,
    flexDirection: 'column',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  extendLabel: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 18,
  },
  extendChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  extendChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  extendChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  extendCount: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  buttonText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 18,
  },
  noExtensions: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  notTodayLink: {
    alignSelf: 'center',
    padding: Spacing.md,
  },
  notTodayText: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.62)',
  },
  branding: {
    position: 'absolute',
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.1)',
  },
});

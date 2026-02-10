import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import {
  useActiveTimerTaskId,
  useActiveTimerEventId,
  useTimerRemainingSeconds,
  useTimerProgress,
} from '../../store/timerStore';
import { useGetTaskById } from '../../store/taskStore';
import { TASK_CATEGORIES } from '../../types/task';
import { formatCountdown } from '../../utils/extensionTiers';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

export function ActiveTimerBar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeTaskId = useActiveTimerTaskId();
  const activeEventId = useActiveTimerEventId();
  const remainingSeconds = useTimerRemainingSeconds();
  const progress = useTimerProgress();
  const getTaskById = useGetTaskById();

  if (!activeTaskId) return null;

  const task = getTaskById(activeTaskId);
  if (!task) return null;

  const categoryConfig = TASK_CATEGORIES.find((c) => c.key === task.category);
  const categoryIcon = (categoryConfig?.icon || 'grid') as keyof typeof Feather.glyphMap;

  const handlePress = () => {
    navigation.navigate('FocusTimer', {
      taskId: activeTaskId,
      taskEventId: activeEventId || '',
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Category icon */}
      <View style={styles.iconCircle}>
        <Feather name={categoryIcon} size={16} color={Colors.inProgress} />
      </View>

      {/* Task name + countdown */}
      <View style={styles.content}>
        <Text style={styles.taskName} numberOfLines={1}>
          {task.name}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>

      {/* Countdown */}
      <Text style={styles.countdown}>{formatCountdown(remainingSeconds)}</Text>

      {/* Arrow indicator */}
      <Feather name="chevron-right" size={16} color={Colors.inProgress} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inProgressLight,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.inProgress + '30',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  taskName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.inProgress + '30',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.inProgress,
    borderRadius: 2,
  },
  countdown: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.inProgress,
  },
});

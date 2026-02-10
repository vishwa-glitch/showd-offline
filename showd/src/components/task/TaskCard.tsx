import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import type { Task, TaskCategory } from '../../types/task';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  isInProgress?: boolean;
  timerRemainingSeconds?: number;
  onPress: () => void;
  onComplete: () => void;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  medication: Colors.categoryMedication,
  exercise: Colors.categoryExercise,
  work: Colors.categoryWork,
  self_care: Colors.categorySelfCare,
  habit: Colors.categoryHabit,
  other: Colors.categoryOther,
};

const CATEGORY_ICONS: Record<TaskCategory, keyof typeof Feather.glyphMap> = {
  medication: 'heart',
  exercise: 'activity',
  work: 'briefcase',
  self_care: 'sun',
  habit: 'star',
  other: 'grid',
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatTimerCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TaskCard({ task, isCompleted, isInProgress, timerRemainingSeconds, onPress, onComplete }: TaskCardProps) {
  const categoryColor = CATEGORY_COLORS[task.category];
  const categoryIcon = CATEGORY_ICONS[task.category];

  return (
    <TouchableOpacity
      style={[styles.card, isInProgress && styles.cardInProgress]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category indicator */}
      <View style={[styles.categoryDot, { backgroundColor: isInProgress ? Colors.inProgress : categoryColor }]}>
        <Feather name={isInProgress ? 'play' : categoryIcon} size={16} color={Colors.surface} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.taskName,
            isCompleted && styles.taskNameCompleted,
          ]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <View style={styles.metaRow}>
          {isInProgress && timerRemainingSeconds != null ? (
            <>
              <Feather name="play-circle" size={12} color={Colors.inProgress} />
              <Text style={[styles.metaText, styles.metaTextInProgress]}>
                {formatTimerCountdown(timerRemainingSeconds)} remaining
              </Text>
            </>
          ) : (
            <>
              <Feather name="clock" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{formatTime(task.reminderTime)}</Text>
            </>
          )}
          {task.witnessName && (
            <>
              <Feather name="eye" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{task.witnessName}</Text>
            </>
          )}
          {task.personalWitnessName && (
            <>
              <Feather name="user" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{task.personalWitnessName}</Text>
            </>
          )}
        </View>
        {task.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{task.currentStreak} day streak</Text>
          </View>
        )}
      </View>

      {/* Complete button */}
      <TouchableOpacity
        style={styles.checkButton}
        onPress={(e) => {
          e.stopPropagation?.();
          onComplete();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isCompleted ? (
          <View style={styles.checkCircleDone}>
            <Feather name="check" size={16} color={Colors.surface} />
          </View>
        ) : (
          <View style={styles.checkCircle} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardInProgress: {
    backgroundColor: Colors.inProgressLight,
    borderWidth: 1,
    borderColor: Colors.inProgress,
  },
  categoryDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  taskName: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginRight: Spacing.sm,
  },
  metaTextInProgress: {
    color: Colors.inProgress,
    fontFamily: FontFamily.semiBold,
  },
  streakBadge: {
    backgroundColor: Colors.snoozeLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  streakText: {
    ...Typography.caption,
    color: Colors.snooze,
    fontSize: 10,
  },
  checkButton: {
    padding: Spacing.xs,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkCircleDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

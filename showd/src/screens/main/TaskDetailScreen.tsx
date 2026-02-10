import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTasks, useEvents, useCompleteTask, useDeleteTask } from '../../store/taskStore';
import { cancelTaskReminder } from '../../services/notifications';
import type { TaskDetailScreenProps } from '../../types/navigation';

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatFrequency(frequency: string, days?: number[]): string {
  switch (frequency) {
    case 'daily':
      return 'Every day';
    case 'once':
      return 'One time';
    case 'weekly':
      if (days && days.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map((d) => dayNames[d]).join(', ');
      }
      return 'Weekly';
    case 'custom':
      return 'Custom schedule';
    default:
      return frequency;
  }
}

export function TaskDetailScreen({ navigation, route }: TaskDetailScreenProps) {
  const { taskId } = route.params;
  const tasks = useTasks();
  const allEvents = useEvents();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  const task = tasks.find((t) => t.id === taskId);
  const events = allEvents.filter((e) => e.taskId === taskId);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
          <Button label="Go back" onPress={() => navigation.goBack()} variant="text" />
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Delete "${task.name}"? This will remove all history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            cancelTaskReminder(taskId).catch(() => {});
            deleteTask(taskId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = events.some(
    (e) => e.scheduledFor.startsWith(today) && e.status === 'done'
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {task.name}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditTask', { taskId })}
        >
          <Feather name="edit-2" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="clock" size={18} color={Colors.textTertiary} />
            <Text style={styles.infoLabel}>Reminder</Text>
            <Text style={styles.infoValue}>
              {formatTime(task.reminderTime)}, {formatFrequency(task.frequency, task.frequencyDays)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather name="user" size={18} color={Colors.textTertiary} />
            <Text style={styles.infoLabel}>Witness</Text>
            <Text style={styles.infoValue}>
              {task.witnessName
                ? `${task.witnessName} — Real`
                : task.personalWitnessName
                  ? `${task.personalWitnessName} — Personal`
                  : 'None'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather name="repeat" size={18} color={Colors.textTertiary} />
            <Text style={styles.infoLabel}>Snooze limit</Text>
            <Text style={styles.infoValue}>{task.snoozeLimit}</Text>
          </View>
          {(task.durationMinutes ?? 0) > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Feather name="play-circle" size={18} color={Colors.inProgress} />
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>
                  {task.durationMinutes! >= 60
                    ? `${Math.floor(task.durationMinutes! / 60)}h ${task.durationMinutes! % 60 > 0 ? `${task.durationMinutes! % 60}m` : ''}`
                    : `${task.durationMinutes}m`}
                  {' '}focus timer
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Streak */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{task.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{task.longestStreak}</Text>
              <Text style={styles.streakLabel}>Longest streak</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={isCompletedToday ? 'Completed Today' : 'Mark as Done'}
            onPress={() => completeTask(taskId)}
            disabled={isCompletedToday}
            variant="success"
            fullWidth
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {events.length === 0 ? (
            <Card>
              <Text style={styles.emptyActivity}>
                No activity yet. Complete this task to start tracking.
              </Text>
            </Card>
          ) : (
            <Card padded={false}>
              {events.slice(-5).reverse().map((event, index) => (
                <View key={event.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.activityRow}>
                    <Feather
                      name={
                        event.status === 'done' ? 'check-circle'
                          : event.status === 'in_progress' ? 'play-circle'
                          : 'clock'
                      }
                      size={16}
                      color={
                        event.status === 'done' ? Colors.success
                          : event.status === 'in_progress' ? Colors.inProgress
                          : Colors.snooze
                      }
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityStatus}>
                        {event.status === 'done'
                          ? 'Completed'
                          : event.status === 'snoozed'
                            ? 'Snoozed'
                            : event.status === 'struggled'
                              ? 'Struggled'
                              : event.status === 'missed'
                                ? 'Missed'
                                : event.status === 'in_progress'
                                  ? 'In Progress'
                                  : 'Pending'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {new Date(event.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        {/* Calendar placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <Card>
            <View style={styles.placeholder}>
              <Feather name="calendar" size={32} color={Colors.textTertiary} />
              <Text style={styles.placeholderText}>
                Calendar view coming in a future update
              </Text>
            </View>
          </Card>
        </View>

        {/* Delete */}
        <Button
          label="Delete Task"
          onPress={handleDelete}
          variant="text"
          textStyle={{ color: Colors.missed }}
          style={styles.deleteButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    width: 80,
  },
  infoValue: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  streakCard: {
    marginBottom: Spacing.base,
  },
  streakRow: {
    flexDirection: 'row',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakNumber: {
    ...Typography.heading1,
    color: Colors.primary,
  },
  streakLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  streakDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  actions: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
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
  emptyActivity: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityStatus: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  placeholderText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  deleteButton: {
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
});

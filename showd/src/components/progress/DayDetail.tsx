import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Card } from '../ui/Card';
import { formatDayHeader, toDateString, getEventsForDay } from '../../utils/dateUtils';
import { formatDuration } from '../../../src/utils/extensionTiers';
import { TASK_CATEGORIES } from '../../types/task';
import type { Task, TaskEvent, TaskCategory } from '../../types/task';

interface DayDetailProps {
  year: number;
  month: number;
  day: number;
  events: readonly TaskEvent[];
  tasks: readonly Task[];
}

const CATEGORY_ICONS: Record<TaskCategory, keyof typeof Feather.glyphMap> = {
  medication: 'heart',
  exercise: 'activity',
  work: 'briefcase',
  self_care: 'sun',
  habit: 'star',
  other: 'grid',
};

const STATUS_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; label: string }> = {
  done: { icon: 'check-circle', color: Colors.success, label: 'Done' },
  missed: { icon: 'x-circle', color: Colors.missed, label: 'Missed' },
  struggled: { icon: 'cloud', color: Colors.struggling, label: 'Struggled' },
  snoozed: { icon: 'clock', color: Colors.snooze, label: 'Snoozed' },
  in_progress: { icon: 'play-circle', color: Colors.inProgress, label: 'In Progress' },
  pending: { icon: 'circle', color: Colors.textTertiary, label: 'Pending' },
};

function formatEventDetail(event: TaskEvent, task: Task | undefined): string {
  const config = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending;
  let detail = config.label;

  if (event.status === 'done' && event.respondedAt) {
    const time = new Date(event.respondedAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    detail = `Done at ${time}`;
  }

  if (event.status === 'done' && event.snoozeCount > 0) {
    detail = `Snoozed ${event.snoozeCount}x, then Done`;
  }

  if (event.status === 'struggled' && event.strugglingReason) {
    detail = `Struggled (${event.strugglingReason})`;
  }

  // Timed task detail
  if (
    event.status === 'done' &&
    event.actualDurationSeconds != null &&
    event.actualDurationSeconds > 0
  ) {
    const actualMin = Math.round(event.actualDurationSeconds / 60);
    const targetMin = event.originalDurationMinutes ?? task?.durationMinutes;
    let timedDetail = `Done in ${actualMin} min`;
    if (targetMin) {
      timedDetail += ` (target: ${targetMin})`;
    }
    if (event.extensionsUsed && event.extensionsUsed > 0) {
      timedDetail += ` +${event.extensionsUsed} extension${event.extensionsUsed > 1 ? 's' : ''}`;
    }
    detail = timedDetail;
  }

  return detail;
}

export function DayDetail({ year, month, day, events, tasks }: DayDetailProps) {
  const dateStr = toDateString(year, month, day);
  const dayEvents = getEventsForDay(events, dateStr);

  // Deduplicate: show only the most relevant event per task
  // Priority: done > struggled > missed > in_progress > snoozed > pending
  const taskEventMap = new Map<string, TaskEvent>();
  for (const event of dayEvents) {
    const existing = taskEventMap.get(event.taskId);
    if (!existing || getStatusPriority(event.status) > getStatusPriority(existing.status)) {
      taskEventMap.set(event.taskId, event);
    }
  }

  const uniqueEvents = Array.from(taskEventMap.values());

  return (
    <View>
      <Text style={styles.header}>{formatDayHeader(year, month, day)}</Text>
      {uniqueEvents.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No tasks scheduled this day</Text>
        </Card>
      ) : (
        <Card padded={false}>
          {uniqueEvents.map((event, index) => {
            const task = tasks.find((t) => t.id === event.taskId);
            const categoryIcon = task
              ? CATEGORY_ICONS[task.category]
              : 'circle';
            const statusConfig = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending;
            const detail = formatEventDetail(event, task);

            return (
              <View key={event.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.eventRow}>
                  <Feather
                    name={categoryIcon}
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTaskName} numberOfLines={1}>
                      {task?.name ?? 'Unknown task'}
                    </Text>
                    <View style={styles.statusRow}>
                      <Feather
                        name={statusConfig.icon}
                        size={12}
                        color={statusConfig.color}
                      />
                      <Text
                        style={[styles.statusText, { color: statusConfig.color }]}
                      >
                        {detail}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );
}

function getStatusPriority(status: string): number {
  switch (status) {
    case 'done': return 5;
    case 'struggled': return 4;
    case 'missed': return 3;
    case 'in_progress': return 2;
    case 'snoozed': return 1;
    default: return 0;
  }
}

const styles = StyleSheet.create({
  header: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTaskName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});

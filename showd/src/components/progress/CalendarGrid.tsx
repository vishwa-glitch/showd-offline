import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import {
  getDaysInMonth,
  getMonthStartDay,
  getDayStatus,
  isToday,
  toDateString,
} from '../../utils/dateUtils';
import type { DayStatus } from '../../utils/dateUtils';
import type { Task, TaskEvent } from '../../types/task';

interface CalendarGridProps {
  year: number;
  month: number;
  events: readonly TaskEvent[];
  tasks: readonly Task[];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STATUS_DOT_COLORS: Record<DayStatus, string | null> = {
  all_done: Colors.success,
  partial: Colors.snooze,
  all_missed: Colors.missed,
  struggled: Colors.struggling,
  timer_done: Colors.inProgress,
  none: null,
};

export function CalendarGrid({
  year,
  month,
  events,
  tasks,
  selectedDay,
  onSelectDay,
}: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getMonthStartDay(year, month);

  // Build cells: padding + actual days
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  // Pad to complete the last row
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  // Split into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {DAY_HEADERS.map((label, i) => (
          <View key={i} style={styles.headerCell}>
            <Text style={styles.headerText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day cells */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((day, colIndex) => {
            if (day === null) {
              return <View key={colIndex} style={styles.cell} />;
            }

            const dateStr = toDateString(year, month, day);
            const status = getDayStatus(events, tasks, dateStr);
            const dotColor = STATUS_DOT_COLORS[status];
            const today = isToday(year, month, day);
            const selected = selectedDay === day;

            return (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  today && styles.cellToday,
                  selected && styles.cellSelected,
                ]}
                onPress={() => onSelectDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    today && styles.dayTextToday,
                    selected && styles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
                {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  headerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: CELL_SIZE,
    marginVertical: 2,
  },
  cellToday: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: CELL_SIZE / 2,
  },
  cellSelected: {
    backgroundColor: Colors.primaryLight,
    borderRadius: CELL_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dayTextToday: {
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  dayTextSelected: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
});

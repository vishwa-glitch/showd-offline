import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Input } from '../ui/Input';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { DurationPicker } from './DurationPicker';
import {
  TaskFormData,
  TaskCategory,
  TaskFrequency,
  AccountabilityType,
  TASK_CATEGORIES,
  DEFAULT_FORM_DATA,
} from '../../types/task';

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  medication: Colors.categoryMedication,
  exercise: Colors.categoryExercise,
  work: Colors.categoryWork,
  self_care: Colors.categorySelfCare,
  habit: Colors.categoryHabit,
  other: Colors.categoryOther,
};

const FREQUENCY_OPTIONS: { key: TaskFrequency; label: string }[] = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'custom', label: 'Custom' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  submitLabel: string;
}

export function TaskForm({
  initialData,
  onSubmit,
  submitLabel,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const updateForm = (updates: Partial<TaskFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const isValid = form.name.trim().length > 0 && form.category !== null;

  const timeDate = (() => {
    const [h, m] = form.reminderTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      updateForm({ reminderTime: `${hours}:${minutes}` });
    }
  };

  const toggleDay = (dayIndex: number) => {
    const days = [...form.frequencyDays];
    const idx = days.indexOf(dayIndex);
    if (idx >= 0) {
      days.splice(idx, 1);
    } else {
      days.push(dayIndex);
    }
    updateForm({ frequencyDays: days });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Task Name */}
      <View style={styles.section}>
        <Input
          label="Task Name"
          placeholder="What do you need to do?"
          value={form.name}
          onChangeText={(name) => updateForm({ name })}
          autoFocus
        />
        <Input
          label="Description (optional)"
          placeholder="Add details..."
          value={form.description}
          onChangeText={(description) => updateForm({ description })}
          multiline
        />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.chipRow}>
          {TASK_CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              icon={cat.icon as any}
              selected={form.category === cat.key}
              onPress={() => updateForm({ category: cat.key })}
              color={CATEGORY_COLORS[cat.key]}
            />
          ))}
        </View>
      </View>

      {/* Reminder Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remind me at</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Feather name="clock" size={20} color={Colors.primary} />
          <Text style={styles.timeText}>{formatTime(form.reminderTime)}</Text>
          <Feather name="chevron-right" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        {showTimePicker && (
          <View>
            <DateTimePicker
              value={timeDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
            {Platform.OS === 'ios' && (
              <Button
                label="Done"
                variant="text"
                onPress={() => setShowTimePicker(false)}
              />
            )}
          </View>
        )}
      </View>

      {/* Frequency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How often</Text>
        <View style={styles.chipRow}>
          {FREQUENCY_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              label={opt.label}
              selected={form.frequency === opt.key}
              onPress={() => updateForm({ frequency: opt.key })}
            />
          ))}
        </View>
        {form.frequency === 'weekly' && (
          <View style={styles.dayRow}>
            {DAY_LABELS.map((label, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCircle,
                  form.frequencyDays.includes(index) && styles.dayCircleSelected,
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    form.frequencyDays.includes(index) && styles.dayLabelSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How long does this take?</Text>
        <DurationPicker
          value={form.durationMinutes}
          onChange={(durationMinutes) => updateForm({ durationMinutes })}
          category={form.category}
        />
      </View>

      {/* Accountability Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accountability style</Text>
        <View style={styles.accountabilityRow}>
          <TouchableOpacity
            style={[
              styles.accountabilityCard,
              form.accountabilityType === 'real' && styles.accountabilityCardSelected,
            ]}
            onPress={() => updateForm({ accountabilityType: 'real' })}
          >
            <Feather name="users" size={24} color={form.accountabilityType === 'real' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.accountabilityTitle, form.accountabilityType === 'real' && styles.accountabilityTitleSelected]}>
              Real Accountability
            </Text>
            <Text style={styles.accountabilityDesc}>
              Someone you trust gets notified
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.accountabilityCard,
              form.accountabilityType === 'personal' && styles.accountabilityCardSelected,
            ]}
            onPress={() => updateForm({ accountabilityType: 'personal' })}
          >
            <Feather name="user" size={24} color={form.accountabilityType === 'personal' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.accountabilityTitle, form.accountabilityType === 'personal' && styles.accountabilityTitleSelected]}>
              Personal
            </Text>
            <Text style={styles.accountabilityDesc}>
              A name on your reminders
            </Text>
          </TouchableOpacity>
        </View>

        {form.accountabilityType === 'real' && (
          <View style={styles.witnessInputs}>
            <Input
              label="Witness phone number"
              placeholder="+1 (555) 000-0000"
              value={form.witnessPhone}
              onChangeText={(witnessPhone) => updateForm({ witnessPhone })}
              keyboardType="phone-pad"
            />
            <Input
              label="Witness name"
              placeholder="What's their name?"
              value={form.witnessName}
              onChangeText={(witnessName) => updateForm({ witnessName })}
            />
          </View>
        )}

        {form.accountabilityType === 'personal' && (
          <View style={styles.witnessInputs}>
            <Input
              label="Who motivates you?"
              placeholder="Mom, Coach Dave, etc."
              value={form.personalWitnessName}
              onChangeText={(personalWitnessName) =>
                updateForm({ personalWitnessName })
              }
            />
          </View>
        )}
      </View>

      {/* Snooze Limit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Snooze limit</Text>
        <Text style={styles.sectionSubtext}>
          How many times can you snooze this reminder?
        </Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              updateForm({ snoozeLimit: Math.max(1, form.snoozeLimit - 1) })
            }
          >
            <Feather name="minus" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{form.snoozeLimit}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              updateForm({ snoozeLimit: Math.min(3, form.snoozeLimit + 1) })
            }
          >
            <Feather name="plus" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Submit */}
      <Button
        label={submitLabel}
        onPress={() => onSubmit(form)}
        disabled={!isValid}
        fullWidth
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
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
  sectionSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  timeText: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dayLabelSelected: {
    color: Colors.surface,
  },
  accountabilityRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  accountabilityCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountabilityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  accountabilityTitle: {
    ...Typography.caption,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  accountabilityTitleSelected: {
    color: Colors.primary,
  },
  accountabilityDesc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontSize: 11,
  },
  witnessInputs: {
    marginTop: Spacing.base,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperValue: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});

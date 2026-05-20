import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows, MIN_TOUCH_TARGET } from '../../utils/spacing';
import { Input } from '../ui/Input';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { DurationPicker } from './DurationPicker';
import {
  TaskFormData,
  TaskCategory,
  TaskFrequency,
  TASK_CATEGORIES,
  DEFAULT_FORM_DATA,
} from '../../types/task';
import { useSelectedSoundId } from '../../store/soundStore';
import { getSoundName } from '../../utils/sounds';
import { formatReminderTime, formatTime12hFromDate, parseReminderTime } from '../../utils/reminderTime';

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
const DEFAULT_UNLOCK_WINDOW = { startTime: '08:00', endTime: '10:00' };

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  submitLabel: string;
}

function dateToHM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function hmToDate(hm: string): Date {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatHM(hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function TaskForm({
  initialData,
  onSubmit,
  submitLabel,
}: TaskFormProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const selectedSoundId = useSelectedSoundId();
  const [form, setForm] = useState<TaskFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  const updateForm = (updates: Partial<TaskFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const unlockWindow = form.firstUnlockWindow ?? DEFAULT_UNLOCK_WINDOW;
  const isWindowValid =
    form.triggerType !== 'first_unlock' ||
    (form.firstUnlockWindow != null &&
      form.firstUnlockWindow.startTime < form.firstUnlockWindow.endTime);
  const isValid =
    form.name.trim().length > 0 &&
    form.category !== null &&
    isWindowValid;

  const timeDate = (() => {
    const parsed = parseReminderTime(form.reminderTime);
    const d = new Date();
    if (parsed) {
      d.setHours(parsed.hours, parsed.minutes, 0, 0);
    }
    return d;
  })();

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      updateForm({ reminderTime: formatTime12hFromDate(selectedDate) });
    }
  };

  const handleStartWindowChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setStartPickerOpen(false);
    }
    if (!selectedDate) return;

    const startTime = dateToHM(selectedDate);
    setForm((prev) => ({
      ...prev,
      reminderTime: startTime,
      firstUnlockWindow: {
        ...(prev.firstUnlockWindow ?? DEFAULT_UNLOCK_WINDOW),
        startTime,
      },
    }));
  };

  const handleEndWindowChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setEndPickerOpen(false);
    }
    if (!selectedDate) return;

    const endTime = dateToHM(selectedDate);
    setForm((prev) => ({
      ...prev,
      firstUnlockWindow: {
        ...(prev.firstUnlockWindow ?? DEFAULT_UNLOCK_WINDOW),
        endTime,
      },
    }));
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

  const selectFixedTime = () => {
    updateForm({
      triggerType: 'fixed_time',
      firstUnlockWindow: null,
    });
  };

  const selectFirstUnlock = () => {
    setForm((prev) => {
      const firstUnlockWindow = prev.firstUnlockWindow ?? DEFAULT_UNLOCK_WINDOW;
      return {
        ...prev,
        triggerType: 'first_unlock',
        firstUnlockWindow,
        reminderTime: firstUnlockWindow.startTime,
      };
    });
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      ...form,
      reminderTime:
        form.triggerType === 'first_unlock'
          ? form.firstUnlockWindow?.startTime ?? form.reminderTime
          : form.reminderTime,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: Spacing['4xl'] + insets.bottom },
      ]}
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
        <Text style={styles.label}>Category</Text>
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

      {/* Trigger */}
      <View style={styles.section}>
        <Text style={styles.label}>Trigger</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Fixed time"
            selected={form.triggerType === 'fixed_time'}
            onPress={selectFixedTime}
            icon="clock"
          />
          <Chip
            label="First unlock"
            selected={form.triggerType === 'first_unlock'}
            onPress={selectFirstUnlock}
            icon="unlock"
          />
        </View>
        <Text style={styles.helperText}>
          {form.triggerType === 'fixed_time'
            ? 'Reminder fires at the time you set.'
            : 'Reminder fires the first time you unlock your phone within the window.'}
        </Text>
      </View>

      {form.triggerType === 'fixed_time' && (
        <View style={styles.section}>
          <Text style={styles.label}>Remind me at</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Feather name="clock" size={20} color={Colors.primary} />
            <Text style={styles.timeText}>{formatReminderTime(form.reminderTime)}</Text>
            <Feather name="chevron-right" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showTimePicker && (
            <View>
              <DateTimePicker
                value={timeDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={false}
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
      )}

      {form.triggerType === 'first_unlock' && (
        <View style={styles.section}>
          <Text style={styles.label}>Unlock window</Text>
          <View style={styles.windowRow}>
            <TouchableOpacity
              style={styles.windowPicker}
              onPress={() => setStartPickerOpen(true)}
            >
              <Feather name="sunrise" size={18} color={Colors.textSecondary} />
              <Text style={styles.windowLabel}>Start</Text>
              <Text style={styles.windowValue}>{formatHM(unlockWindow.startTime)}</Text>
            </TouchableOpacity>
            <Text style={styles.windowSeparator}>to</Text>
            <TouchableOpacity
              style={styles.windowPicker}
              onPress={() => setEndPickerOpen(true)}
            >
              <Feather name="sunset" size={18} color={Colors.textSecondary} />
              <Text style={styles.windowLabel}>End</Text>
              <Text style={styles.windowValue}>{formatHM(unlockWindow.endTime)}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Reminder fires the first time you unlock your phone within the window. If you don't unlock during the window, no reminder fires today.
          </Text>
          {!isWindowValid && (
            <Text style={styles.errorText}>End time must be after start time.</Text>
          )}
          {startPickerOpen && (
            <View>
              <DateTimePicker
                value={hmToDate(unlockWindow.startTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={false}
                onChange={handleStartWindowChange}
              />
              {Platform.OS === 'ios' && (
                <Button
                  label="Done"
                  variant="text"
                  onPress={() => setStartPickerOpen(false)}
                />
              )}
            </View>
          )}
          {endPickerOpen && (
            <View>
              <DateTimePicker
                value={hmToDate(unlockWindow.endTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={false}
                onChange={handleEndWindowChange}
              />
              {Platform.OS === 'ios' && (
                <Button
                  label="Done"
                  variant="text"
                  onPress={() => setEndPickerOpen(false)}
                />
              )}
            </View>
          )}
        </View>
      )}

      {/* Frequency */}
      <View style={styles.section}>
        <Text style={styles.label}>How often</Text>
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
        {form.frequency === 'custom' && (
          <View style={styles.customIntervalRow}>
            <Text style={styles.customIntervalLabel}>Every</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  updateForm({ customIntervalDays: Math.max(2, form.customIntervalDays - 1) })
                }
              >
                <Feather name="minus" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{form.customIntervalDays}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  updateForm({ customIntervalDays: Math.min(30, form.customIntervalDays + 1) })
                }
              >
                <Feather name="plus" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.customIntervalLabel}>days</Text>
          </View>
        )}
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.label}>How long does this take?</Text>
        <DurationPicker
          value={form.durationMinutes}
          onChange={(durationMinutes) => updateForm({ durationMinutes })}
          category={form.category}
        />
      </View>

      <TouchableOpacity
        style={styles.moreOptionsHeader}
        onPress={() => setMoreOptionsOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.moreOptionsLabel}>More options</Text>
        <Feather
          name={moreOptionsOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {moreOptionsOpen && (
        <View style={styles.moreOptionsContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Where will this live? (optional)</Text>
            <Input
              placeholder="e.g., Blue pillbox on kitchen counter"
              value={form.locationNote}
              onChangeText={(locationNote) => updateForm({ locationNote })}
              multiline={false}
              maxLength={120}
            />
            <Text style={styles.helperText}>
              Shown on the reminder so you don't have to remember.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>How to dismiss</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Swipe"
                selected={form.dismissAction === 'swipe'}
                onPress={() => updateForm({ dismissAction: 'swipe' })}
                icon="chevrons-right"
              />
              <Chip
                label="Math"
                selected={form.dismissAction === 'math'}
                onPress={() => updateForm({ dismissAction: 'math' })}
                icon="hash"
              />
              <Chip
                label="Shake"
                selected={form.dismissAction === 'shake'}
                onPress={() => updateForm({ dismissAction: 'shake' })}
                icon="smartphone"
              />
            </View>
            <Text style={styles.helperText}>
              {form.dismissAction === 'swipe' && 'Tap Done to dismiss. Easy.'}
              {form.dismissAction === 'math' && 'Solve a quick math problem to dismiss. Prevents reflex tapping.'}
              {form.dismissAction === 'shake' && 'Shake the phone to dismiss. Forces conscious action.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Auto-renag if ignored</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Off"
                selected={form.nagInterval === 'off'}
                onPress={() => updateForm({ nagInterval: 'off' })}
              />
              <Chip
                label="3 min"
                selected={form.nagInterval === '3m'}
                onPress={() => updateForm({ nagInterval: '3m' })}
              />
              <Chip
                label="5 min"
                selected={form.nagInterval === '5m'}
                onPress={() => updateForm({ nagInterval: '5m' })}
              />
              <Chip
                label="10 min"
                selected={form.nagInterval === '10m'}
                onPress={() => updateForm({ nagInterval: '10m' })}
              />
            </View>
            <Text style={styles.helperText}>
              {form.nagInterval === 'off'
                ? 'Reminder fires once.'
                : `Re-fires every ${form.nagInterval.replace('m', ' min')} if not answered.`}
            </Text>
          </View>

          {form.frequency === 'daily' && (
            <View style={styles.section}>
              <Text style={styles.label}>Weekly goal</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    form.weeklyGoal <= 1 && styles.stepperButtonDisabled,
                  ]}
                  onPress={() =>
                    updateForm({ weeklyGoal: Math.max(1, form.weeklyGoal - 1) })
                  }
                  disabled={form.weeklyGoal <= 1}
                >
                  <Feather name="minus" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>
                  {form.weeklyGoal} of 7 days
                </Text>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    form.weeklyGoal >= 7 && styles.stepperButtonDisabled,
                  ]}
                  onPress={() =>
                    updateForm({ weeklyGoal: Math.min(7, form.weeklyGoal + 1) })
                  }
                  disabled={form.weeklyGoal >= 7}
                >
                  <Feather name="plus" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Aim for {form.weeklyGoal} out of 7. Missing a day won't break your streak.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Snooze limit</Text>
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
                  updateForm({ snoozeLimit: Math.min(5, form.snoozeLimit + 1) })
                }
              >
                <Feather name="plus" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Reminder sound</Text>
            <TouchableOpacity
              style={styles.soundRow}
              onPress={() => navigation.navigate('ReminderSound')}
              activeOpacity={0.6}
            >
              <Feather name="volume-2" size={20} color={Colors.textSecondary} />
              <Text style={styles.soundLabel}>
                {getSoundName(form.reminderSoundId ?? selectedSoundId)}
              </Text>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Submit */}
      <Button
        label={submitLabel}
        onPress={handleSubmit}
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
  label: {
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
    gap: Spacing.sm,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.missed,
    marginTop: Spacing.sm,
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
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  windowPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  windowLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  windowValue: {
    ...Typography.body,
    fontFamily: FontFamily.semiBold,
    marginLeft: 'auto',
    color: Colors.textPrimary,
  },
  windowSeparator: {
    ...Typography.body,
    color: Colors.textTertiary,
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
  moreOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  moreOptionsLabel: {
    ...Typography.body,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  moreOptionsContent: {
    gap: Spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  stepperButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperButtonDisabled: {
    opacity: 0.45,
  },
  stepperValue: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  soundLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    textTransform: 'capitalize',
  },
  customIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  customIntervalLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
});

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
  Image,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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
  TASK_CATEGORIES,
  DEFAULT_FORM_DATA,
} from '../../types/task';
import { useSelectedSoundId } from '../../store/soundStore';
import { useDefaultSnoozeLimit } from '../../store/onboardingStore';
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

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  submitLabel: string;
  showWitnessPhotoOptionalHint?: boolean;
}

export function TaskForm({
  initialData,
  onSubmit,
  submitLabel,
  showWitnessPhotoOptionalHint = false,
}: TaskFormProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const selectedSoundId = useSelectedSoundId();
  const defaultSnoozeLimit = useDefaultSnoozeLimit();
  const [form, setForm] = useState<TaskFormData>({
    ...DEFAULT_FORM_DATA,
    snoozeLimit: defaultSnoozeLimit,
    ...initialData,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const updateForm = (updates: Partial<TaskFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const isValid =
    form.name.trim().length > 0 &&
    form.category !== null;

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

  const handlePickWitnessPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to choose a witness photo.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const pickedUri = result.assets?.[0]?.uri;
      if (pickedUri) {
        updateForm({ witnessPhotoUri: pickedUri });
      }
    }
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

      {/* Witness */}
      <View style={styles.section}>
        <Input
          label="Witness name (optional)"
          placeholder="Who is counting on you?"
          value={form.witnessName}
          onChangeText={(witnessName) => updateForm({ witnessName })}
        />
        <View style={styles.witnessPhotoRow}>
          <View style={styles.witnessPhotoPreview}>
            {form.witnessPhotoUri ? (
              <Image source={{ uri: form.witnessPhotoUri }} style={styles.witnessPhotoImage} />
            ) : (
              <Feather name="user" size={20} color={Colors.textTertiary} />
            )}
          </View>

          <View style={styles.witnessPhotoActions}>
            <View style={styles.witnessPhotoTopRow}>
              <TouchableOpacity
                style={styles.witnessPhotoButton}
                onPress={handlePickWitnessPhoto}
                activeOpacity={0.8}
              >
                <Feather name="image" size={16} color={Colors.textPrimary} />
                <Text style={styles.witnessPhotoButtonText}>
                  {form.witnessPhotoUri ? 'Change photo' : 'Add photo'}
                </Text>
              </TouchableOpacity>
              {showWitnessPhotoOptionalHint && !form.witnessPhotoUri && (
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              )}
            </View>

            {form.witnessPhotoUri ? (
              <TouchableOpacity
                onPress={() => updateForm({ witnessPhotoUri: '' })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.witnessPhotoHint}>
                {showWitnessPhotoOptionalHint
                  ? 'Optional. Shown on reminder screen.'
                  : 'Shown on reminder screen'}
              </Text>
            )}
          </View>
        </View>
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
        <Text style={styles.sectionTitle}>How long does this take?</Text>
        <DurationPicker
          value={form.durationMinutes}
          onChange={(durationMinutes) => updateForm({ durationMinutes })}
          category={form.category}
        />
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
              updateForm({ snoozeLimit: Math.min(5, form.snoozeLimit + 1) })
            }
          >
            <Feather name="plus" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>



      {/* Reminder Sound */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder sound</Text>
        <TouchableOpacity
          style={styles.soundRow}
          onPress={() => navigation.navigate('ReminderSound')}
          activeOpacity={0.6}
        >
          <Feather name="volume-2" size={20} color={Colors.textSecondary} />
          <Text style={styles.soundLabel}>
            {getSoundName(selectedSoundId)}
          </Text>
          <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
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
  witnessPhotoRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  witnessPhotoPreview: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  witnessPhotoImage: {
    width: '100%',
    height: '100%',
  },
  witnessPhotoActions: {
    flex: 1,
    gap: Spacing.xs,
  },
  witnessPhotoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  witnessPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  witnessPhotoButtonText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontFamily: FontFamily.semiBold,
  },
  optionalBadge: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  optionalBadgeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontFamily: FontFamily.medium,
  },
  witnessPhotoHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  removePhotoText: {
    ...Typography.caption,
    color: Colors.missed,
  },
});

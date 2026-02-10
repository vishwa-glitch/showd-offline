import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Chip } from '../ui/Chip';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import type { TaskCategory } from '../../types/task';

interface DurationPickerProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
  category?: TaskCategory | null;
}

const DURATION_PRESETS: { label: string; value: number | null }[] = [
  { label: 'None', value: null },
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '1h', value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h', value: 120 },
];

export function DurationPicker({ value, onChange, category }: DurationPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHours, setCustomHours] = useState('0');
  const [customMinutes, setCustomMinutes] = useState('30');

  const isPreset = DURATION_PRESETS.some((p) => p.value === value);
  const isCustomSelected = value !== null && !isPreset;
  const isMedication = category === 'medication';

  const handlePresetPress = (presetValue: number | null) => {
    setShowCustom(false);
    onChange(presetValue);
  };

  const handleCustomToggle = () => {
    if (showCustom) {
      setShowCustom(false);
      onChange(null);
    } else {
      setShowCustom(true);
      const h = parseInt(customHours, 10) || 0;
      const m = parseInt(customMinutes, 10) || 0;
      const total = h * 60 + m;
      if (total > 0) onChange(total);
    }
  };

  const handleCustomChange = (hours: string, minutes: string) => {
    setCustomHours(hours);
    setCustomMinutes(minutes);
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const total = h * 60 + m;
    if (total > 0) onChange(total);
  };

  return (
    <View>
      <View style={styles.chipRow}>
        {DURATION_PRESETS.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            selected={value === preset.value && !showCustom}
            onPress={() => handlePresetPress(preset.value)}
          />
        ))}
        <Chip
          label="Custom"
          selected={showCustom || isCustomSelected}
          onPress={handleCustomToggle}
        />
      </View>

      {showCustom && (
        <View style={styles.customRow}>
          <View style={styles.customInput}>
            <TextInput
              style={styles.input}
              value={customHours}
              onChangeText={(t) => handleCustomChange(t, customMinutes)}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.inputLabel}>hr</Text>
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.customInput}>
            <TextInput
              style={styles.input}
              value={customMinutes}
              onChangeText={(t) => handleCustomChange(customHours, t)}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="30"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.inputLabel}>min</Text>
          </View>
        </View>
      )}

      {isMedication && value === null && (
        <Text style={styles.helperText}>
          Medication tasks don't need a timer.
        </Text>
      )}

      {value === null && !isMedication && (
        <Text style={styles.helperText}>
          Set a duration to get a focus timer. Leave blank for instant tasks.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
  },
  colon: {
    ...Typography.heading3,
    color: Colors.textTertiary,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});

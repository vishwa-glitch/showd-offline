import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import type { ReminderSoundScreenProps } from '../../types/navigation';

const SOUND_OPTIONS = [
  { id: 'default', label: 'Default', caption: undefined },
  { id: 'gentle_chime', label: 'Gentle Chime', caption: undefined },
  { id: 'urgent_bell', label: 'Urgent Bell', caption: undefined },
  { id: 'classic_ring', label: 'Classic Ring', caption: undefined },
  { id: 'soft_pulse', label: 'Soft Pulse', caption: undefined },
  { id: 'silent', label: 'Silent', caption: 'Vibration only. Make sure vibration is enabled.' },
] as const;

type SoundId = (typeof SOUND_OPTIONS)[number]['id'];

export function ReminderSoundScreen({ navigation }: ReminderSoundScreenProps) {
  const [selected, setSelected] = useState<SoundId>('default');

  const handleSelect = (id: SoundId) => {
    if (id === selected) return;
    setSelected(id);
    Alert.alert('Updated', `Reminder sound set to ${SOUND_OPTIONS.find((s) => s.id === id)?.label}`);
  };

  const handlePreview = (id: SoundId) => {
    console.log('[TODO] Play sound preview:', id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Reminder Sound</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.explanation}>
          This sound plays when a reminder takes over your screen.
        </Text>

        <View style={styles.list}>
          {SOUND_OPTIONS.map((option, index) => {
            const isSelected = option.id === selected;
            return (
              <React.Fragment key={option.id}>
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  activeOpacity={0.6}
                  onPress={() => handleSelect(option.id)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                      {option.label}
                    </Text>
                    {option.caption && (
                      <Text style={styles.rowCaption}>{option.caption}</Text>
                    )}
                  </View>

                  <View style={styles.rowRight}>
                    {option.id !== 'silent' && (
                      <TouchableOpacity
                        onPress={() => handlePreview(option.id)}
                        hitSlop={8}
                        style={styles.playButton}
                      >
                        <Feather name="volume-2" size={16} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    )}

                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
                {index < SOUND_OPTIONS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  explanation: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    minHeight: 48,
  },
  rowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  rowLabelSelected: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  rowCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playButton: {
    padding: Spacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.base,
  },
});

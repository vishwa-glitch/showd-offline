import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { BUILT_IN_SOUNDS, DEFAULT_SOUND_ID } from '../../utils/sounds';
import { useSelectedSoundId, useSetSelectedSound } from '../../store/soundStore';
import { previewSound, stopSound } from '../../services/soundPlayer';
import type { ReminderSoundScreenProps } from '../../types/navigation';

export function ReminderSoundScreen({ navigation }: ReminderSoundScreenProps) {
  const selectedSoundId = useSelectedSoundId();
  const setSelectedSound = useSetSelectedSound();

  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Stop any preview sound when leaving the screen
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const handleSelect = (soundId: string) => {
    if (soundId === selectedSoundId) return;
    setSelectedSound(soundId);
  };

  const handlePreview = async (soundId: string) => {
    // If already previewing this sound, stop it
    if (previewingId === soundId) {
      await stopSound();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(soundId);
    const sound = BUILT_IN_SOUNDS.find((s) => s.id === soundId);
    const duration = (sound?.loopDuration ?? 3) * 1000;
    await previewSound(soundId, duration);
    // Reset icon after preview finishes
    setTimeout(() => setPreviewingId(null), duration);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { stopSound(); navigation.goBack(); }}>
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
          Choose the sound for all your reminders.
        </Text>

        <View style={styles.list}>
          {BUILT_IN_SOUNDS.map((sound, index) => {
            const isSelected = sound.id === selectedSoundId;
            return (
              <React.Fragment key={sound.id}>
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  activeOpacity={0.6}
                  onPress={() => handleSelect(sound.id)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                      {sound.name}
                    </Text>
                    <Text style={styles.rowCaption}>{sound.description}</Text>
                  </View>

                  <View style={styles.rowRight}>
                    <TouchableOpacity
                      onPress={() => handlePreview(sound.id)}
                      hitSlop={8}
                      style={styles.playButton}
                    >
                      <Feather
                        name={previewingId === sound.id ? 'volume-2' : 'play'}
                        size={16}
                        color={previewingId === sound.id ? Colors.primary : Colors.textTertiary}
                      />
                    </TouchableOpacity>

                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
                {index < BUILT_IN_SOUNDS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.footerNote}>
          This sound will play on repeat when your full-screen reminder appears.
        </Text>
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
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
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
    minHeight: 56,
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
  footerNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});

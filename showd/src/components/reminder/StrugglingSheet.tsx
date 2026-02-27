import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import {
  useCloseStrugglingSheet,
  useDismissReminder,
  useActiveTaskId,
} from '../../store/reminderStore';
import { useActiveTimerTaskId, useAbandonTimer } from '../../store/timerStore';
import { useStruggleTask, useGetTaskById } from '../../store/taskStore';
import { cancelActiveReminder, scheduleNextRegularReminder } from '../../services/notifications';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

const REASONS = [
  'Too tired',
  'No motivation',
  'Forgot until now',
  'Feeling overwhelmed',
  'Not feeling well',
  'Other',
] as const;

type Reason = (typeof REASONS)[number];

export function StrugglingSheet() {
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [otherNote, setOtherNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reminderTaskId = useActiveTaskId();
  const timerTaskId = useActiveTimerTaskId();
  const activeTaskId = reminderTaskId || timerTaskId;
  const isFromTimer = !reminderTaskId && !!timerTaskId;
  const closeStrugglingSheet = useCloseStrugglingSheet();
  const dismissReminder = useDismissReminder();
  const abandonTimer = useAbandonTimer();
  const struggleTask = useStruggleTask();
  const getTaskById = useGetTaskById();
  const scrollRef = useRef<ScrollView>(null);

  const handleSelect = useCallback((reason: Reason) => {
    setSelectedReason(reason);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedReason || !activeTaskId) return;

    const reason = selectedReason === 'Other' && otherNote.trim()
      ? otherNote.trim()
      : selectedReason;

    struggleTask(activeTaskId, reason, selectedReason === 'Other' ? otherNote.trim() : undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    cancelActiveReminder(activeTaskId).catch(() => {});
    if (!isFromTimer) {
      const task = getTaskById(activeTaskId);
      if (task) {
        scheduleNextRegularReminder(task).catch(() => {});
      }
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason(null);
      setOtherNote('');
      if (isFromTimer) {
        abandonTimer();
        closeStrugglingSheet();
      } else {
        dismissReminder();
      }
    }, 2000);
  }, [selectedReason, otherNote, activeTaskId, isFromTimer, struggleTask, getTaskById, dismissReminder, abandonTimer, closeStrugglingSheet]);

  const handleClose = useCallback(() => {
    setSelectedReason(null);
    setOtherNote('');
    closeStrugglingSheet();
  }, [closeStrugglingSheet]);

  if (submitted) {
    return (
      <Animated.View style={styles.overlay} entering={FadeIn.duration(300)}>
        <View style={styles.encourageContainer}>
          <Text style={styles.encourageText}>
            Tomorrow's a new day.{'\n'}You've got this.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={styles.overlay} entering={FadeInUp.duration(400)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="x" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Heading */}
            <Text style={styles.heading}>That's okay. Let's log it.</Text>
            <Text style={styles.subtext}>
              Being honest is the first step. No judgment here.
            </Text>

            {/* Reason chips */}
            <View style={styles.chipsContainer}>
              {REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => handleSelect(reason)}
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    selectedReason === reason && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedReason === reason && styles.chipTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Other note input */}
            {selectedReason === 'Other' && (
              <TextInput
                style={styles.noteInput}
                placeholder="What's going on?"
                placeholderTextColor={Colors.textTertiary}
                value={otherNote}
                onChangeText={setOtherNote}
                multiline
                maxLength={200}
                autoFocus
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                }}
              />
            )}

            {/* Submit button */}
            {selectedReason && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>Log & Close</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: SHEET_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    zIndex: 10,
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  heading: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
  },
  chipSelected: {
    backgroundColor: Colors.struggling,
  },
  chipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
  },
  noteInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.xl,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 18,
  },
  encourageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 10, 20, 0.92)',
  },
  encourageText: {
    ...Typography.heading2,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
});

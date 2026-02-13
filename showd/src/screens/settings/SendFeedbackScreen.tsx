import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import type { SendFeedbackScreenProps } from '../../types/navigation';

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: 'alert-circle' as const },
  { id: 'feature', label: 'Feature Idea', icon: 'zap' as const },
  { id: 'general', label: 'General', icon: 'message-circle' as const },
  { id: 'appreciation', label: 'Appreciation', icon: 'heart' as const },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]['id'];

const MAX_CHARS = 1000;

export function SendFeedbackScreen({ navigation }: SendFeedbackScreenProps) {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = type !== null && message.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const feedback = {
      type,
      message: message.trim(),
      email: email.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[DEMO] Feedback submitted:', feedback);

    // Store locally for future Supabase sync
    try {
      const existing = await AsyncStorage.getItem('showd-feedback-queue');
      const queue = existing ? JSON.parse(existing) : [];
      queue.push(feedback);
      await AsyncStorage.setItem('showd-feedback-queue', JSON.stringify(queue));
    } catch {
      // Non-critical — don't block success
    }

    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check" size={40} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Thanks for your feedback!</Text>
          <Text style={styles.successSubtext}>We read every message.</Text>
          <Button
            label="Back to Settings"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Send Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            {"We\u2019d love to hear from you. Bug reports, feature ideas, or just telling us what you think \u2014 it all helps."}
          </Text>

          {/* Feedback type chips */}
          <View style={styles.chipRow}>
            {FEEDBACK_TYPES.map((ft) => {
              const selected = ft.id === type;
              return (
                <TouchableOpacity
                  key={ft.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  activeOpacity={0.7}
                  onPress={() => setType(ft.id)}
                >
                  <Feather
                    name={ft.icon}
                    size={14}
                    color={selected ? Colors.surface : Colors.textTertiary}
                  />
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={Colors.textTertiary}
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, MAX_CHARS))}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {message.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Email (optional) */}
          <View style={styles.emailGroup}>
            <Text style={styles.emailLabel}>Your email (optional)</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.emailCaption}>Only if you'd like us to follow up</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomSection}>
          <Button
            label="Send Feedback"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: Spacing.xl,
  },
  intro: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chipLabelSelected: {
    color: Colors.surface,
  },
  messageContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  messageInput: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 150,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  emailGroup: {
    marginBottom: Spacing.xl,
  },
  emailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  emailInput: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  emailCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

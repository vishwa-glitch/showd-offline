import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import { openPlayStoreRating } from '../../services/ratingPrompt';
import type { SendFeedbackScreenProps } from '../../types/navigation';

const REASONS = [
  { id: 'reminders', icon: 'bell' as const, text: 'The reminders actually work' },
  { id: 'streaks', icon: 'zap' as const, text: 'Building streaks keeps me going' },
  { id: 'simple', icon: 'heart' as const, text: "It's simple and beautiful" },
  { id: 'focus', icon: 'target' as const, text: 'Helps me focus and get things done' },
] as const;

export function SendFeedbackScreen({ navigation }: SendFeedbackScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleRateOnPlayStore = async () => {
    setLoading(true);
    try {
      await openPlayStoreRating();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Rate Showd</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing['4xl'] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* App icon & appeal */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Enjoying Showd?</Text>
          <Text style={styles.heroSubtext}>
            Your rating helps other people discover Showd and keeps an indie developer going.
          </Text>
        </View>

        {/* Why rate section */}
        <Text style={styles.sectionLabel}>WHY YOUR RATING MATTERS</Text>
        <View style={styles.reasonsCard}>
          {REASONS.map((reason, index) => (
            <View key={reason.id}>
              <View style={styles.reasonRow}>
                <View style={styles.reasonIcon}>
                  <Feather name={reason.icon} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.reasonText}>{reason.text}</Text>
              </View>
              {index < REASONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Stars visual */}
        <View style={styles.starsSection}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Feather
                key={star}
                name="star"
                size={32}
                color={Colors.snooze}
              />
            ))}
          </View>
          <Text style={styles.starsCaption}>
            Takes less than 30 seconds
          </Text>
        </View>

        {/* CTA */}
        <Button
          label={loading ? 'Opening Play Store...' : '⭐ Rate on Play Store'}
          onPress={handleRateOnPlayStore}
          disabled={loading}
          loading={loading}
          fullWidth
          style={styles.rateButton}
        />

        <Text style={styles.footerNote}>
          Thank you for supporting Showd! 💛
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
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  reasonsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 60,
  },
  starsSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  starsCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  rateButton: {
    marginBottom: Spacing.lg,
  },
  footerNote: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

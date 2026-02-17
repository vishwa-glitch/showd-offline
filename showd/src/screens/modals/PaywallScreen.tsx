import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useOfferings, usePurchase, useRestore } from '../../store/subscriptionStore';
import type { PaywallScreenProps } from '../../types/navigation';
import type { PaywallReason } from '../../types/subscription';

const PAYWALL_COPY: Record<PaywallReason, { headline: string; subheadline: string }> = {
  task_limit: {
    headline: 'Need more tasks?',
    subheadline: 'Free accounts support 3 tasks. Go Pro for unlimited.',
  },
  real_accountability: {
    headline: 'Ready for real accountability?',
    subheadline: 'Your witness will get real SMS when you miss a task.',
  },
  trial_witness_limit: {
    headline: 'Want more witnesses?',
    subheadline: 'Your trial includes 1 witness. Go Pro for unlimited.',
  },
  photo_proof: {
    headline: 'Prove you did it',
    subheadline: 'Photo proof lets your witness see the evidence.',
  },
  full_progress: {
    headline: 'Your full journey',
    subheadline: 'See your complete history and track long-term progress.',
  },
  custom_sound: {
    headline: 'Make it yours',
    subheadline: 'Upload your own reminder sound with Pro.',
  },
  three_snoozes: {
    headline: 'Need more snoozes?',
    subheadline: 'Pro gives you 3 snoozes per task instead of 2.',
  },
  pro_required: {
    headline: 'Unlock the full experience',
    subheadline: 'Go Pro for unlimited tasks, witnesses, and more.',
  },
};

const PRO_FEATURES = [
  'Unlimited tasks',
  'Real Accountability (SMS to witnesses)',
  'Photo proof',
  'Full progress history',
  '3 snoozes per task',
  'Custom reminder sounds',
  'Witness dashboard',
];

export function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const params = route.params;
  const reason = params?.reason ?? 'pro_required';
  const copy = PAYWALL_COPY[reason];
  const headline = params?.headline ?? copy.headline;
  const subheadline = params?.subheadline ?? copy.subheadline;

  const offerings = useOfferings();
  const purchase = usePurchase();
  const restore = useRestore();

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const annualPkg = offerings?.annual;
  const monthlyPkg = offerings?.monthly;

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? annualPkg : monthlyPkg;
    if (!pkg) {
      Alert.alert('Error', 'Purchase packages not available. Please try again later.');
      return;
    }
    setLoading(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Restored', 'Your Pro subscription has been restored.');
        navigation.goBack();
      } else {
        Alert.alert('No Purchases Found', 'No previous Pro subscription found for this account.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'Something went wrong.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Feather name="x" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Feather name="zap" size={40} color={Colors.proGold} style={styles.heroIcon} />
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.subheadline}>{subheadline}</Text>

        {/* Feature list */}
        <View style={styles.featureCard}>
          {PRO_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Feather name="check" size={18} color={Colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
          onPress={() => setSelectedPlan('annual')}
          activeOpacity={0.7}
        >
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>BEST VALUE</Text>
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>Annual</Text>
            <Text style={styles.planPrice}>
              {annualPkg?.product.priceString ?? '\u20B9999'}/year
            </Text>
            <Text style={styles.planSub}>Save 58%</Text>
          </View>
          <View style={[styles.radio, selectedPlan === 'annual' && styles.radioSelected]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.7}
        >
          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planPrice}>
              {monthlyPkg?.product.priceString ?? '\u20B9199'}/month
            </Text>
          </View>
          <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]} />
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.ctaBtnText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
        >
          <Text style={styles.restoreText}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        <View style={styles.legalRow}>
          <Text style={styles.legalText}>Terms</Text>
          <Text style={styles.legalDot}>{'\u00B7'}</Text>
          <Text style={styles.legalText}>Privacy</Text>
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
  closeBtn: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    zIndex: 10,
    padding: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing['4xl'],
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: Spacing.base,
  },
  headline: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subheadline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.base,
    width: '100%',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  planCardSelected: {
    borderColor: Colors.proGold,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.base,
    backgroundColor: Colors.proGold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.surface,
    letterSpacing: 0.5,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  planPrice: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  planSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.proGold,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioSelected: {
    borderColor: Colors.proGold,
    borderWidth: 6,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  ctaBtnDisabled: {
    opacity: 0.7,
  },
  ctaBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    color: Colors.surface,
  },
  restoreBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  restoreText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textTertiary,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  legalText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  legalDot: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textTertiary,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import type { WelcomeScreenProps } from '../../types/navigation';

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Feather name="bell" size={40} color={Colors.surface} />
          </View>
          <Text style={styles.logoText}>showd.</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.headline}>
            You don't need another todo list.
          </Text>
          <Text style={styles.subheadline}>
            Showd interrupts you like a personal assistant would — until you
            actually do the thing.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Feather name="smartphone" size={20} color={Colors.primary} />
            <Text style={styles.featureText}>Full-screen reminders you can't ignore</Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="users" size={20} color={Colors.primary} />
            <Text style={styles.featureText}>Real people holding you accountable</Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="trending-up" size={20} color={Colors.primary} />
            <Text style={styles.featureText}>Track streaks and build consistency</Text>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        <Button
          label="Get Started"
          onPress={() => navigation.navigate('Onboarding')}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    ...Typography.heading1,
    color: Colors.primary,
  },
  hero: {
    marginBottom: Spacing['2xl'],
  },
  headline: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subheadline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: Spacing.base,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  featureText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
});

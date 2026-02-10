import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import { OEMInstructions } from '../../components/permissions/OEMInstructions';
import { getOEMBrand, getOEMDisplayName } from '../../constants/oemConfig';
import { openOEMBatterySettings } from '../../services/permissions';
import { useSetOEMSetupCompleted } from '../../store/permissionStore';
import { useSignIn } from '../../store/authStore';
import type { OEMBatterySetupScreenProps } from '../../types/navigation';

export function OEMBatterySetupScreen({ route }: OEMBatterySetupScreenProps) {
  const { user } = route.params;
  const brand = getOEMBrand();
  const brandName = getOEMDisplayName();
  const setOEMSetupCompleted = useSetOEMSetupCompleted();
  const signIn = useSignIn();

  const handleOpenSettings = useCallback(async () => {
    await openOEMBatterySettings();
  }, []);

  const handleSkip = useCallback(() => {
    setOEMSetupCompleted();
    signIn(user);
  }, [setOEMSetupCompleted, signIn, user]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Feather name="zap" size={32} color={Colors.snooze} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>
          One more thing for{'\n'}{brandName} phones
        </Text>
        <Text style={styles.subtext}>
          {brandName} phones have aggressive battery saving that can stop
          reminders from working. This takes 30 seconds to fix.
        </Text>

        {/* OEM-specific instructions */}
        <View style={styles.instructionsContainer}>
          <OEMInstructions brand={brand} />
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <Button
          label="Open Settings"
          onPress={handleOpenSettings}
          fullWidth
          style={styles.mainButton}
        />
        <Button
          label="My reminders are working fine"
          onPress={handleSkip}
          variant="text"
          textStyle={styles.skipText}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.snoozeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  heading: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontSize: 28,
  },
  subtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing['2xl'],
  },
  instructionsContainer: {
    width: '100%',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  mainButton: {
    minHeight: 56,
    borderRadius: BorderRadius.xl,
  },
  skipText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
});

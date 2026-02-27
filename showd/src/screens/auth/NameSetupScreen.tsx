import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useUpdateName } from '../../store/onboardingStore';
import type { NameSetupScreenProps } from '../../types/navigation';

export function NameSetupScreen({ navigation }: NameSetupScreenProps) {
  const [name, setName] = useState('');
  const updateName = useUpdateName();

  const handleContinue = () => {
    const trimmed = name.trim();
    if (trimmed) updateName(trimmed);
    navigation.navigate('PermissionSetup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Feather name="user" size={32} color={Colors.primary} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>What should we call you?</Text>
        <Text style={styles.subtext}>
          This is just for personalization. You can skip this or change it later.
        </Text>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Input
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        <Button
          label="Continue"
          onPress={handleContinue}
          fullWidth
          style={styles.mainButton}
        />
        <Button
          label="Skip"
          onPress={handleContinue}
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
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
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
    maxWidth: 300,
    marginBottom: Spacing['2xl'],
  },
  inputContainer: {
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

// ============================================
// DEMO MODE: Supabase user creation commented out.
// Using local UUID for demo.
// Search for [SUPABASE-TODO] to restore.
// ============================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
// [SUPABASE-TODO] Restore:
// import { supabase } from '../../services/supabase';
// import { upsertUser } from '../../services/database';
import type { ProfileSetupScreenProps } from '../../types/navigation';

export function ProfileSetupScreen({ navigation, route }: ProfileSetupScreenProps) {
  const { phone } = route.params;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2;

  const handleStart = async () => {
    setLoading(true);
    // [SUPABASE-TODO] Restore real user creation:
    // const { data: { user: authUser } } = await supabase.auth.getUser();
    // const userId = authUser?.id || `user_${Date.now()}`;
    const now = new Date().toISOString();
    const user = {
      id: `user_${Date.now()}`,
      phone,
      name: name.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      quietHoursEnabled: false,
      defaultSnoozeLimit: 3,
      isGuest: false,
      createdAt: now,
      updatedAt: now,
    };
    // [SUPABASE-TODO] Restore: await upsertUser(user).catch(() => {});
    await new Promise((r) => setTimeout(r, 400)); // simulate save
    setLoading(false);
    navigation.navigate('PermissionSetup', { user });
  };

  const handlePhotoTap = () => {
    Alert.alert('Coming Soon', 'Photo upload will be available in a future update.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Almost there!</Text>
        <Text style={styles.subtext}>
          Tell us a bit about yourself.
        </Text>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatar} onPress={handlePhotoTap}>
          <Feather name="camera" size={32} color={Colors.textTertiary} />
          <Text style={styles.avatarText}>Add photo</Text>
        </TouchableOpacity>

        {/* Name Input */}
        <Input
          label="What should we call you?"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View style={styles.bottomSection}>
        <Button
          label="Start Using Showd"
          onPress={handleStart}
          disabled={!isValid}
          loading={loading}
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
    paddingTop: Spacing['3xl'],
  },
  heading: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});

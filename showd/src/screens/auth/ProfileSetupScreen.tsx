import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { dbToUser } from '../../utils/mappers';
import { getUser, updateUserFields } from '../../services/database';
import { supabase } from '../../services/supabase';
import type { ProfileSetupScreenProps } from '../../types/navigation';

export function ProfileSetupScreen({ navigation, route }: ProfileSetupScreenProps) {
  const { phone } = route.params;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2;

  const handleStart = async () => {
    setLoading(true);
    try {
      // Get current authenticated Supabase user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id;

      if (!userId) {
        Alert.alert('Error', 'Authentication session not found. Please try again.');
        setLoading(false);
        return;
      }

      // Update user row in Supabase (created by Edge Function)
      await updateUserFields(userId, {
        name: name.trim(),
        updated_at: new Date().toISOString(),
      });

      // Fetch the complete user record
      const { data: userData } = await getUser(userId);

      // Don't signIn here — PermissionSetupScreen.finishSetup() handles it.
      // Calling signIn here would set isAuthenticated=true, causing AppNavigator
      // to swap from AuthStack to RootStack before PermissionSetup can render.
      setLoading(false);
      navigation.navigate('PermissionSetup', { user: dbToUser(userData!) });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to save profile.');
    }
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
          onChangeText={(text) => setName(text.replace(/[0-9]/g, ''))}
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
        <Text style={styles.trialCaption}>
          You're getting 7 days of Showd Pro — all features, no charge.
        </Text>
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
    gap: Spacing.md,
  },
  trialCaption: {
    ...Typography.caption,
    color: Colors.proGold,
    textAlign: 'center',
  },
});

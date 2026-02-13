import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUser, useUpdateProfile } from '../../store/authStore';
import type { EditProfileScreenProps } from '../../types/navigation';

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const user = useUser();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  const hasChanges = name.trim() !== (user?.name ?? '');
  const isValid = name.trim().length >= 2;

  const handlePhotoTap = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            console.log('[TODO] Open camera');
          } else if (buttonIndex === 2) {
            console.log('[TODO] Open gallery');
          }
        },
      );
    } else {
      Alert.alert('Change Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => console.log('[TODO] Open camera') },
        { text: 'Choose from Library', onPress: () => console.log('[TODO] Open gallery') },
      ]);
    }
  };

  const handleSave = async () => {
    if (!isValid || !hasChanges) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    updateProfile({ name: name.trim() });
    setLoading(false);
    Alert.alert('Success', 'Profile updated');
    navigation.goBack();
  };

  const initials = (user?.name ?? 'G').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatar} onPress={handlePhotoTap}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePhotoTap}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Input
          label="Display Name"
          placeholder="Your name"
          value={name}
          onChangeText={(text) => setName(text.replace(/[0-9]/g, ''))}
          autoCapitalize="words"
        />

        {/* Phone — read only */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {user?.phone || 'Not set'}
            </Text>
          </View>
          <Text style={styles.fieldCaption}>Phone number can't be changed</Text>
        </View>

        {/* Timezone — read only */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Timezone</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
            </Text>
          </View>
          <Text style={styles.fieldCaption}>Automatically detected</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Button
          label="Save Changes"
          onPress={handleSave}
          disabled={!hasChanges || !isValid}
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FontFamily.bold,
    fontSize: 36,
    color: '#FFFFFF',
  },
  changePhotoText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.primary,
  },
  fieldGroup: {
    marginBottom: Spacing.base,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  readOnlyField: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textTertiary,
  },
  fieldCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});

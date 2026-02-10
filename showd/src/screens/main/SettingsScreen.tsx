import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useUser, useIsGuest, useSignOut } from '../../store/authStore';
import { ReminderHealthCheck } from '../../components/permissions/ReminderHealthCheck';

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
  rightElement,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
    >
      <Feather
        name={icon}
        size={20}
        color={danger ? Colors.missed : Colors.textSecondary}
      />
      <Text
        style={[
          styles.rowLabel,
          danger && { color: Colors.missed },
        ]}
      >
        {label}
      </Text>
      {rightElement || (
        <View style={styles.rowRight}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          {showChevron && onPress && (
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const user = useUser();
  const isGuest = useIsGuest();
  const signOut = useSignOut();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will delete all your data, tasks, and witness connections. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const comingSoon = () => {
    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingRow
            icon="user"
            label="Profile"
            value={user?.name || 'Guest'}
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="phone"
            label="Phone number"
            value={isGuest ? 'Not set' : user?.phone || ''}
            onPress={isGuest ? comingSoon : undefined}
          />
          {isGuest && (
            <>
              <View style={styles.divider} />
              <SettingRow
                icon="shield"
                label="Verify your phone number"
                onPress={comingSoon}
              />
            </>
          )}
        </View>

        {/* Reminder Health */}
        <Text style={styles.sectionTitle}>Reminder Health</Text>
        <ReminderHealthCheck />

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.section}>
          <SettingRow
            icon="moon"
            label="Quiet Hours"
            onPress={comingSoon}
            value="Off"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="bell"
            label="Default snooze limit"
            value={`${user?.defaultSnoozeLimit || 3}`}
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="volume-2"
            label="Reminder sound"
            value="Default"
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="smartphone"
            label="Vibration"
            showChevron={false}
            rightElement={
              <Switch
                value={true}
                onValueChange={() => { }}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.surface}
              />
            }
          />
        </View>

        {/* Connections */}
        <Text style={styles.sectionTitle}>Connections</Text>
        <View style={styles.section}>
          <SettingRow
            icon="users"
            label="My witnesses"
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="heart"
            label="People I support"
            onPress={comingSoon}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingRow
            icon="help-circle"
            label="How Showd works"
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="message-square"
            label="Send feedback"
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="file-text"
            label="Privacy Policy"
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="file-text"
            label="Terms of Service"
            onPress={comingSoon}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info"
            label="Version"
            value="1.0.0"
            showChevron={false}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.section}>
          <SettingRow
            icon="log-out"
            label="Sign out"
            danger
            onPress={handleSignOut}
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="trash-2"
            label="Delete account"
            danger
            onPress={handleDeleteAccount}
            showChevron={false}
          />
        </View>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
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
    paddingBottom: Spacing['4xl'],
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    minHeight: 48,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowValue: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52,
  },
});

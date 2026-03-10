import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useUserName, useUpdateName } from '../../store/onboardingStore';
import { ReminderHealthCheck } from '../../components/permissions/ReminderHealthCheck';
import { useSelectedSoundId } from '../../store/soundStore';
import { getSoundName } from '../../utils/sounds';
import { openPlayStoreRating } from '../../services/ratingPrompt';
import type { SettingsScreenProps } from '../../types/navigation';

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

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const userName = useUserName();
  const updateName = useUpdateName();
  const selectedSoundId = useSelectedSoundId();
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');

  const handleEditName = () => {
    setNameInput(userName || '');
    setShowNameModal(true);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateName(nameInput.trim());
    }
    setShowNameModal(false);
  };

  const handleRateApp = async () => {
    await openPlayStoreRating();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.section}>
          <SettingRow
            icon="user"
            label="Your name"
            value={userName || 'Not set'}
            onPress={handleEditName}
          />
        </View>

        {/* Reminder Health */}
        <Text style={styles.sectionTitle}>Reminder Health</Text>
        <ReminderHealthCheck />

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.section}>
          <SettingRow
            icon="bell"
            label="Default snooze limit"
            value="3"
            onPress={() => navigation.navigate('SnoozeLimit')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="volume-2"
            label="Reminder sound"
            value={getSoundName(selectedSoundId)}
            onPress={() => navigation.navigate('ReminderSound')}
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

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingRow
            icon="help-circle"
            label="How Showd works"
            onPress={() => navigation.navigate('HowShowdWorks')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="star"
            label="Rate & Review"
            onPress={handleRateApp}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info"
            label="Version"
            value="1.0.0"
            showChevron={false}
          />
        </View>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>

      {/* Name Edit Modal (works on Android unlike Alert.prompt) */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowNameModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your Name</Text>
            <Text style={styles.modalSubtext}>What should we call you?</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              maxLength={30}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveName}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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

  // Name Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    ...Shadows.lg,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalCancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalCancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalSaveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  modalSaveText: {
    ...Typography.body,
    color: Colors.surface,
    fontFamily: FontFamily.medium,
  },
});

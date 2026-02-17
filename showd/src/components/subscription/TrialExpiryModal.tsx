import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';

interface TrialExpiryModalProps {
  visible: boolean;
  witnessName?: string;
  onGoPro: () => void;
  onDismiss: () => void;
}

export function TrialExpiryModal({
  visible,
  witnessName,
  onGoPro,
  onDismiss,
}: TrialExpiryModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {witnessName ? (
            <>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={32} color={Colors.textTertiary} />
              </View>
              <Text style={styles.heading}>
                {witnessName} won't hear{'\n'}from you anymore.
              </Text>
              <Text style={styles.body}>
                Your accountability with {witnessName} has been paused. They
                won't get updates when you miss tasks or need support.
              </Text>
              <Text style={styles.subheading}>
                With Pro, {witnessName} stays connected:
              </Text>
              <View style={styles.bulletList}>
                <BulletItem text="Gets notified when you need help" />
                <BulletItem text="Sees your progress dashboard" />
                <BulletItem text="Can send you encouragement" />
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={onGoPro}>
                <Text style={styles.primaryBtnText}>
                  Keep {witnessName} Connected — Go Pro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
                <Text style={styles.secondaryBtnText}>
                  Continue without {witnessName}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Feather name="clock" size={32} color={Colors.proGold} />
              </View>
              <Text style={styles.heading}>Your trial has ended</Text>
              <Text style={styles.body}>
                You can still use Showd with:
              </Text>
              <View style={styles.bulletList}>
                <BulletItem text="3 tasks" />
                <BulletItem text="Full-screen reminders" />
                <BulletItem text="Focus timer" />
                <BulletItem text="7-day progress history" />
              </View>
              <Text style={styles.upsellText}>Want the full experience?</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onGoPro}>
                <Text style={styles.primaryBtnText}>Go Pro</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
                <Text style={styles.secondaryBtnText}>Continue with Free</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Feather name="check" size={16} color={Colors.success} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    ...Shadows.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.proGoldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  heading: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subheading: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  upsellText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  bulletList: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.surface,
  },
  secondaryBtn: {
    paddingVertical: Spacing.sm,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textTertiary,
  },
});

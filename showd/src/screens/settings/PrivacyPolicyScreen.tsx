import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import type { PrivacyPolicyScreenProps } from '../../types/navigation';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>
        <Text style={styles.body}>
          Showd is built on one principle: your data stays on your device. Always.
        </Text>

        <Section title="What We Collect">
          {`\u2022 Showd collects nothing. There are no accounts, no sign-ins, and no servers.
\u2022 All tasks, schedules, streaks, completion history, and witness names and photos are stored locally on your device only.
\u2022 We have no access to any of this data.`}
        </Section>

        <Section title="Witness Feature">
          {`\u2022 Witness names and photos you add are stored entirely on your device.
\u2022 No contact is ever made with your witness. No SMS, no notifications, no network requests of any kind.`}
        </Section>

        <Section title="Internet & Permissions">
          {`\u2022 Showd requires no internet connection and makes no network requests.
\u2022 The only device permissions used are local notifications and alarm scheduling to fire reminders at your set times.`}
        </Section>

        <Section title="Third Parties">
          {`\u2022 We use no third-party analytics, advertising SDKs, or tracking tools.
\u2022 Your data is never sold, shared, or transmitted anywhere.`}
        </Section>

        <Section title="Children's Privacy">
          {`\u2022 Showd is safe for all ages. We collect no data from anyone.`}
        </Section>

        <Section title="Changes to This Policy">
          {`\u2022 If this policy changes, the update will be reflected in the app and on our Play Store listing.`}
        </Section>
      </ScrollView>
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
  lastUpdated: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
});

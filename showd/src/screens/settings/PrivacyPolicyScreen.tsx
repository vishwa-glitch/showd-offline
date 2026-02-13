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
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>
        <Text style={styles.body}>
          {"Showd (\u201Cwe\u201D, \u201Cour\u201D, \u201Cus\u201D) is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights."}
        </Text>

        <Section title="What We Collect">
          {`Account Information
\u2022 Your phone number (required for account creation and login)
\u2022 Your display name and optional profile photo
\u2022 Your timezone (automatically detected)

Task Data
\u2022 Task names, descriptions, categories, and schedules you create
\u2022 Your responses to reminders (done, snoozed, struggled, missed)
\u2022 Focus timer data (start times, durations, pauses, extensions)
\u2022 Struggling reasons you choose to log

Witness Information
\u2022 Phone numbers and names of witnesses you add
\u2022 Witness connection status and notification preferences
\u2022 SMS delivery records

Device Information
\u2022 Device type and operating system version
\u2022 Notification and permission settings
\u2022 App version`}
        </Section>

        <Section title="How We Use Your Data">
          {`\u2022 To deliver reminders at the times you set
\u2022 To send SMS notifications to your chosen witnesses
\u2022 To calculate your streaks, completion rates, and progress
\u2022 To improve the app experience and fix bugs
\u2022 We never sell your data to third parties
\u2022 We never show you ads`}
        </Section>

        <Section title="SMS and Witness Communication">
          {`\u2022 We only send SMS messages to phone numbers you explicitly provide as witnesses
\u2022 Witnesses can opt out at any time by replying STOP to any message
\u2022 SMS content is limited to task status updates \u2014 we never share personal details beyond what you configure
\u2022 SMS delivery is handled through Twilio, a trusted communications provider`}
        </Section>

        <Section title="Data Storage and Security">
          {`\u2022 Your data is stored securely using industry-standard encryption
\u2022 Authentication is handled via secure phone number verification
\u2022 We use Supabase (hosted on AWS) for data storage with row-level security
\u2022 Profile photos are stored in encrypted cloud storage`}
        </Section>

        <Section title="Your Rights">
          {`\u2022 You can view all your data within the app at any time
\u2022 You can delete individual tasks and their history
\u2022 You can remove witness connections at any time
\u2022 You can delete your entire account and all associated data from Settings
\u2022 Account deletion is permanent and cannot be undone`}
        </Section>

        <Section title="Data Retention">
          {`\u2022 Active account data is retained as long as your account exists
\u2022 When you delete your account, all data is permanently removed within 30 days
\u2022 SMS logs are retained for 90 days for delivery verification, then deleted
\u2022 Anonymous, aggregated usage statistics may be retained indefinitely`}
        </Section>

        <Section title="Children's Privacy">
          {`\u2022 Showd is not intended for children under 13
\u2022 We do not knowingly collect data from children under 13`}
        </Section>

        <Section title="Changes to This Policy">
          {"We may update this policy from time to time. We\u2019ll notify you of significant changes via in-app notification."}
        </Section>

        <Section title="Contact Us">
          {"Questions about your privacy? Email us at privacy@showd.app"}
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

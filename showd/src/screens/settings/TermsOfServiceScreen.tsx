import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import type { TermsOfServiceScreenProps } from '../../types/navigation';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export function TermsOfServiceScreen({ navigation }: TermsOfServiceScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>
        <Text style={styles.body}>
          By using Showd, you agree to these terms. Please read them carefully.
        </Text>

        <Section title="The Service">
          {`Showd is a task reminder and accountability app. We provide:
\u2022 Unskippable full-screen reminders at times you set
\u2022 Focus timer for timed tasks
\u2022 Optional witness accountability via SMS
\u2022 Progress tracking and streaks`}
        </Section>

        <Section title="Your Account">
          {`\u2022 You must provide a valid phone number to create an account
\u2022 You are responsible for all activity on your account
\u2022 You must be at least 13 years old to use Showd
\u2022 One account per phone number`}
        </Section>

        <Section title="Acceptable Use">
          {`You agree not to:
\u2022 Use Showd to harass, stalk, or send unwanted messages to anyone
\u2022 Add witness phone numbers without the person's knowledge or likely consent
\u2022 Attempt to circumvent the app's reminder or accountability features for the purpose of misleading a witness
\u2022 Use the service for any illegal purpose
\u2022 Reverse engineer or attempt to extract the source code`}
        </Section>

        <Section title="Witness System">
          {`\u2022 By adding a witness, you authorize us to send SMS messages to their phone number on your behalf
\u2022 You represent that you have a reasonable basis to believe the witness would welcome being added (e.g., you've discussed it with them)
\u2022 Witnesses can decline the invitation or opt out at any time
\u2022 We are not responsible for the content of conversations between you and your witness outside of Showd`}
        </Section>

        <Section title="SMS and Messaging">
          {`\u2022 Standard SMS rates from your witness's carrier may apply to messages we send them
\u2022 We make reasonable efforts to deliver messages promptly but cannot guarantee delivery timing
\u2022 Message frequency depends on your task activity and your witness's notification preferences`}
        </Section>

        <Section title="Subscriptions and Payments">
          {`\u2022 Showd Free is available at no cost with limited features
\u2022 Showd Pro is available as a monthly ($4.99/mo) or annual ($39.99/yr) subscription
\u2022 Subscriptions are managed through the App Store (iOS) or Google Play (Android)
\u2022 You can cancel your subscription at any time through your device's subscription settings
\u2022 Refunds are handled according to the policies of Apple or Google`}
        </Section>

        <Section title="Intellectual Property">
          {`\u2022 Showd and its original content, features, and functionality are owned by Showd and are protected by copyright and trademark laws
\u2022 You retain ownership of any personal data you provide`}
        </Section>

        <Section title="Limitation of Liability">
          {`\u2022 Showd is provided "as is" without warranties of any kind
\u2022 We are not responsible for missed reminders due to device settings, battery optimization, or operating system behavior
\u2022 We are not liable for any actions taken by witnesses based on notifications they receive
\u2022 Our total liability is limited to the amount you've paid us in the past 12 months`}
        </Section>

        <Section title="Account Termination">
          {`\u2022 You can delete your account at any time from Settings
\u2022 We may suspend or terminate accounts that violate these terms
\u2022 Upon termination, your data will be deleted in accordance with our Privacy Policy`}
        </Section>

        <Section title="Changes to Terms">
          {"We may update these terms from time to time. Continued use of Showd after changes constitutes acceptance."}
        </Section>

        <Section title="Contact">
          {"Questions? Email us at hello@showd.app"}
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

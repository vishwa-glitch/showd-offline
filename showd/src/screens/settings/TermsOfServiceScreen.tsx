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
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>
        <Text style={styles.body}>
          By using Showd, you agree to these terms.
        </Text>

        <Section title="The Service">
          {`Showd is a free, fully offline task reminder and habit tracking app. We provide:
\u2022 Full-screen reminders at times you set
\u2022 Focus timer for timed tasks
\u2022 Local accountability via witness name and photo
\u2022 Streak tracking and progress calendar`}
        </Section>

        <Section title="No Account Required">
          {`\u2022 Showd requires no account, phone number, or sign-in of any kind.
\u2022 All your data lives on your device and is never transmitted.`}
        </Section>

        <Section title="Acceptable Use">
          {`You agree not to:
\u2022 Use Showd for any illegal purpose
\u2022 Reverse engineer or attempt to extract the source code`}
        </Section>

        <Section title="Cost">
          {`\u2022 Showd is completely free. There are no subscriptions, no in-app purchases, no ads, and no premium features.
\u2022 This will always be free.`}
        </Section>

        <Section title="Intellectual Property">
          {`\u2022 Showd and its design, features, and content are owned by Showd and protected by applicable laws.
\u2022 You retain full ownership of any data you create in the app.`}
        </Section>

        <Section title="Limitation of Liability">
          {`\u2022 Showd is provided "as is" without warranties of any kind.
\u2022 We are not responsible for missed reminders due to device settings, battery optimization, or OS behavior.
\u2022 We are not liable for any outcomes related to tasks missed or completed.`}
        </Section>

        <Section title="Changes to Terms">
          {`\u2022 We may update these terms occasionally. Continued use of Showd after changes means you accept the updated terms.`}
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

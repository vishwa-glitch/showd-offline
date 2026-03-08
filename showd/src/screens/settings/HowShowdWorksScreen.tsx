import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { useTasks } from '../../store/taskStore';
import {
  DarkColors,
  MiniTaskCards,
  MiniReminderMockup,
  ThreeChoices,
  MiniTimerMockup,
  MiniCalendarWeek,
} from '../../components/howItWorks/Mockups';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'HowShowdWorks'>;

function StepSection({
  stepNumber,
  heading,
  body,
  children,
  delay = 0,
}: {
  stepNumber: string;
  heading: string;
  body: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(300)}
      style={styles.stepSection}
    >
      <Text style={styles.stepNumber}>{stepNumber}</Text>
      <Text style={styles.stepHeading}>{heading}</Text>
      <Text style={styles.stepBody}>{body}</Text>
      {children && <View style={styles.stepVisual}>{children}</View>}
    </Animated.View>
  );
}

export function HowShowdWorksScreen({ navigation }: Props) {
  const tasks = useTasks();
  const hasTasks = tasks.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkColors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <Animated.View entering={FadeInUp.duration(300)} style={styles.heroHeader}>
            <View style={styles.logoIcon}>
              <Feather name="activity" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>How Showd Works</Text>
            <Text style={styles.heroSubtitle}>
              A simple, offline task reminder that actually makes you do the thing.
            </Text>
          </Animated.View>

          {/* Step 1 */}
          <StepSection
            stepNumber="01"
            heading="Create a task that matters"
            body="Add the thing you keep putting off - take your medication, exercise, deep work, journaling. Set a time, pick how often (daily, weekly, or custom), and optionally set a duration for tasks that take longer than a moment. Add a name that matters to you - a coach, a parent, a friend. They don't need the app. Their name just shows up on your screen when it's time. Sometimes that's enough."
            delay={100}
          >
            <MiniTaskCards />
          </StepSection>

          {/* Step 2 */}
          <StepSection
            stepNumber="02"
            heading="When it's time, your screen gets taken over"
            body="No banner notification you can swipe away. Showd takes over your entire screen — like an incoming call. You can't ignore it. You have to make a choice."
            delay={150}
          >
            <MiniReminderMockup />
          </StepSection>

          {/* Step 3 */}
          <StepSection
            stepNumber="03"
            heading="Three honest choices. Every one is valid."
            body="No guilt. No shame. Just honesty about where you're at today."
            delay={200}
          >
            <ThreeChoices />
          </StepSection>

          {/* Step 4 */}
          <StepSection
            stepNumber="04"
            heading="For bigger tasks, a focus timer keeps you locked in"
            body="Set a duration on tasks that take real time — exercise, deep work, meditation. When the reminder fires, tap Start and a countdown begins. You can pause, finish early, or ask for more time when it runs out."
            delay={250}
          >
            <MiniTimerMockup />
          </StepSection>

          {/* Step 5 */}
          <StepSection
            stepNumber="05"
            heading="Watch yourself become consistent"
            body="Track your streaks, see your completion rate climb, and look back at every day on the calendar. Green days stack up. You start to not want to break the chain."
            delay={300}
          >
            <MiniCalendarWeek />
          </StepSection>

          {/* Step 6 - Offline & Privacy */}
          <StepSection
            stepNumber="06"
            heading="100% offline. Your data stays on your device."
            body="No accounts, no cloud sync, no tracking. Showd works entirely on your device. Your tasks, your progress, your streaks — all stored locally. No internet required, ever."
            delay={350}
          />

          {/* Closing */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(300)}
            style={styles.closingSection}
          >
            <View style={styles.closingDivider} />
            <Text style={styles.closingMuted}>
              {"Showd doesn't nag. It doesn't guilt-trip."}
            </Text>
            <Text style={styles.closingBold}>
              It just shows up — and asks you to do the same.
            </Text>
            <Text style={styles.closingBrand}>Showd.</Text>
            {!hasTasks ? (
              <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CreateTask')}
              >
                <Text style={styles.ctaText}>Create Your First Task</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.closingEncouragement}>
                {"You're already on your way. 💛"}
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'] * 2,
  },

  /* Hero */
  heroHeader: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
    paddingTop: Spacing.xl,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 77, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: DarkColors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },

  /* Steps */
  stepSection: {
    marginBottom: Spacing['4xl'],
  },
  stepNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 48,
    color: Colors.primary,
    opacity: 0.3,
    marginBottom: Spacing.sm,
  },
  stepHeading: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  stepBody: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: DarkColors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  stepVisual: {
    marginTop: Spacing.xs,
  },

  /* Closing */
  closingSection: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  closingDivider: {
    width: 60,
    height: 1,
    backgroundColor: DarkColors.divider,
    marginBottom: Spacing.lg,
  },
  closingMuted: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: DarkColors.textSecondary,
    textAlign: 'center',
  },
  closingBold: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  closingBrand: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: 'rgba(255, 77, 106, 0.4)',
    marginTop: Spacing.xl,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  ctaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  closingEncouragement: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: DarkColors.textTertiary,
    marginTop: Spacing.base,
  },
});

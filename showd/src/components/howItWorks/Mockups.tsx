import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';

export const DarkColors = {
  background: '#1A1A1A',
  surface: '#2A2A2A',
  surfaceInset: '#222222',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  divider: 'rgba(255, 255, 255, 0.1)',
} as const;

/* ─── Mini Task Cards ─── */

export function MiniTaskCards() {
  return (
    <View style={s.cardContainer}>
      <View style={s.taskCard}>
        <View style={s.taskRow}>
          <View style={[s.categoryDot, { backgroundColor: Colors.categoryMedication }]}>
            <Text style={s.categoryEmoji}>{'💊'}</Text>
          </View>
          <View style={s.taskInfo}>
            <Text style={s.taskName}>Morning Medication</Text>
            <View style={s.taskMeta}>
              <Feather name="clock" size={11} color={DarkColors.textTertiary} />
              <Text style={s.taskMetaText}>8:00 AM · Daily</Text>
            </View>
            <View style={s.taskMeta}>
              <Feather name="eye" size={11} color={DarkColors.textTertiary} />
              <Text style={s.taskMetaText}>Sarah watching</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.cardDivider} />

      <View style={s.taskCard}>
        <View style={s.taskRow}>
          <View style={[s.categoryDot, { backgroundColor: Colors.categoryExercise }]}>
            <Text style={s.categoryEmoji}>{'🏋️'}</Text>
          </View>
          <View style={s.taskInfo}>
            <Text style={s.taskName}>30-min Workout</Text>
            <View style={s.taskMeta}>
              <Feather name="clock" size={11} color={DarkColors.textTertiary} />
              <Text style={s.taskMetaText}>7:00 AM · Daily</Text>
            </View>
            <View style={s.taskMeta}>
              <Feather name="eye" size={11} color={DarkColors.textTertiary} />
              <Text style={s.taskMetaText}>Coach Dave watching</Text>
            </View>
          </View>
          <View style={s.durationPill}>
            <Feather name="clock" size={10} color="#FFFFFF" />
            <Text style={s.durationText}>30m</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─── Accountability Cards ─── */

export function AccountabilityCards() {
  return (
    <View style={s.accountabilityRow}>
      <View style={[s.accountabilityCard, s.accountabilityCardReal]}>
        <Text style={s.accountabilityEmoji}>{'🔥'}</Text>
        <Text style={s.accountabilityTitle}>Real</Text>
        <Text style={s.accountabilityDesc}>
          Sarah gets notified if you miss
        </Text>
        <View style={s.recommendedBadge}>
          <Text style={s.recommendedText}>Recommended</Text>
        </View>
      </View>

      <View style={s.accountabilityCard}>
        <Text style={s.accountabilityEmoji}>{'🪞'}</Text>
        <Text style={s.accountabilityTitle}>Personal</Text>
        <Text style={s.accountabilityDesc}>
          Mom's name appears on your reminder screen
        </Text>
      </View>
    </View>
  );
}

/* ─── Mini Reminder Mockup ─── */

export function MiniReminderMockup() {
  return (
    <View style={s.reminderContainer}>
      <View style={s.reminderInner}>
        <Text style={s.reminderEmoji}>{'🏋️'}</Text>

        <View style={s.witnessCircle}>
          <Text style={s.witnessInitials}>J</Text>
        </View>

        <Text style={s.reminderTaskName}>30-min Workout</Text>
        <Text style={s.reminderWitnessLine}>Jordan is counting on you</Text>

        <View style={s.reminderButtons}>
          <View style={[s.reminderBtn, { backgroundColor: Colors.inProgress }]}>
            <Feather name="play" size={14} color="#FFFFFF" />
            <Text style={s.reminderBtnText}>Start (30m)</Text>
          </View>
          <View style={[s.reminderBtn, { backgroundColor: Colors.snooze }]}>
            <Feather name="clock" size={14} color="#FFFFFF" />
            <Text style={s.reminderBtnText}>Snooze 15min</Text>
          </View>
          <View style={[s.reminderBtn, { backgroundColor: Colors.struggling }]}>
            <Feather name="cloud" size={14} color="#FFFFFF" />
            <Text style={s.reminderBtnText}>Struggling Today</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─── Three Choices ─── */

const CHOICES = [
  {
    icon: 'check-circle' as const,
    color: Colors.success,
    label: 'Done',
    desc: 'You did the thing. Streak grows. Your witness is proud.',
  },
  {
    icon: 'clock' as const,
    color: Colors.snooze,
    label: 'Snooze',
    desc: "Not now, but soon. You get up to 3 chances before it's now or never.",
  },
  {
    icon: 'cloud' as const,
    color: Colors.struggling,
    label: 'Struggling',
    desc: 'Honest about today. Your witness gets a gentle heads-up so they can check in.',
  },
];

export function ThreeChoices() {
  return (
    <View style={s.choicesContainer}>
      {CHOICES.map((choice, index) => (
        <React.Fragment key={choice.label}>
          <View style={s.choiceRow}>
            <View style={[s.choiceDot, { backgroundColor: choice.color }]}>
              <Feather name={choice.icon} size={16} color="#FFFFFF" />
            </View>
            <View style={s.choiceContent}>
              <Text style={s.choiceLabel}>{choice.label}</Text>
              <Text style={s.choiceDesc}>{choice.desc}</Text>
            </View>
          </View>
          {index < CHOICES.length - 1 && <View style={s.choiceDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

/* ─── Mini Timer Mockup ─── */

export function MiniTimerMockup() {
  return (
    <View style={s.timerContainer}>
      <Text style={s.timerEmoji}>{'🏋️'}</Text>
      <Text style={s.timerTaskName}>30-min Workout</Text>

      <View style={s.timerRingOuter}>
        <View style={s.timerRingInner}>
          <Text style={s.timerTime}>18:42</Text>
          <Text style={s.timerLabel}>remaining</Text>
        </View>
      </View>

      <View style={s.timerButtonRow}>
        <View style={s.timerBtnPause}>
          <Feather name="pause" size={14} color="#FFFFFF" />
          <Text style={s.timerBtnText}>Pause</Text>
        </View>
        <View style={s.timerBtnDone}>
          <Feather name="check" size={14} color="#FFFFFF" />
          <Text style={s.timerBtnText}>I'm Done</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── SMS Bubbles ─── */

export function SmsBubbles() {
  return (
    <View style={s.smsContainer}>
      <View style={s.smsHeader}>
        <Feather name="smartphone" size={14} color={DarkColors.textTertiary} />
        <Text style={s.smsHeaderText}>From Showd</Text>
      </View>

      <View style={s.smsBubble}>
        <View style={s.smsBubbleAccent} />
        <Text style={s.smsBubbleText}>
          {"Alex's day: ✅ 4/5 done.\nMissed: Evening meditation.\nStreak: 12 days — Showd"}
        </Text>
      </View>

      <View style={[s.smsBubble, s.smsBubbleWarm]}>
        <View style={[s.smsBubbleAccent, { backgroundColor: Colors.snooze }]} />
        <Text style={s.smsBubbleText}>
          {'Alex is having a tough day with Morning Exercise. A kind word might help 💛 — Showd'}
        </Text>
      </View>
    </View>
  );
}

/* ─── Mini Calendar Week ─── */

const WEEK = [
  { label: 'Mon', done: true },
  { label: 'Tue', done: true },
  { label: 'Wed', done: true },
  { label: 'Thu', done: false },
  { label: 'Fri', done: true },
  { label: 'Sat', done: true },
  { label: 'Sun', done: true },
];

export function MiniCalendarWeek() {
  return (
    <View style={s.calendarContainer}>
      <View style={s.calendarWeek}>
        {WEEK.map((day) => (
          <View key={day.label} style={s.calendarDay}>
            <Text style={s.calendarDayLabel}>{day.label}</Text>
            <View
              style={[
                s.calendarDot,
                { backgroundColor: day.done ? Colors.success : Colors.missed },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={s.streakRow}>
        <Text style={s.streakText}>{'🔥 12-day streak'}</Text>
      </View>
    </View>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
  /* Task Cards */
  cardContainer: {
    backgroundColor: DarkColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.border,
    overflow: 'hidden',
  },
  taskCard: {
    padding: Spacing.base,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: DarkColors.textPrimary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: DarkColors.textTertiary,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.inProgress,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  cardDivider: {
    height: 1,
    backgroundColor: DarkColors.border,
  },

  /* Accountability Cards */
  accountabilityRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  accountabilityCard: {
    flex: 1,
    backgroundColor: DarkColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.border,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  accountabilityCardReal: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  accountabilityEmoji: {
    fontSize: 24,
  },
  accountabilityTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: DarkColors.textPrimary,
  },
  accountabilityDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: DarkColors.textSecondary,
    lineHeight: 18,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 77, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  recommendedText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.primary,
  },

  /* Reminder Mockup */
  reminderContainer: {
    backgroundColor: 'rgba(15, 10, 20, 0.92)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.borderSubtle,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  reminderInner: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  reminderEmoji: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  witnessCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 77, 106, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 77, 106, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  witnessInitials: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  reminderTaskName: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  reminderWitnessLine: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  reminderButtons: {
    width: '100%',
    gap: Spacing.sm,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  reminderBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* Three Choices */
  choicesContainer: {
    backgroundColor: DarkColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.border,
    overflow: 'hidden',
  },
  choiceRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  choiceDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  choiceContent: {
    flex: 1,
    gap: 2,
  },
  choiceLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: DarkColors.textPrimary,
  },
  choiceDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: DarkColors.textSecondary,
    lineHeight: 18,
  },
  choiceDivider: {
    height: 1,
    backgroundColor: DarkColors.border,
    marginLeft: 60,
  },

  /* Timer Mockup */
  timerContainer: {
    backgroundColor: DarkColors.surfaceInset,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.borderSubtle,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  timerEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  timerTaskName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: DarkColors.textPrimary,
    marginBottom: Spacing.lg,
  },
  timerRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primary,
    borderLeftColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    transform: [{ rotate: '-45deg' }],
  },
  timerRingInner: {
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  timerTime: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: '#FFFFFF',
  },
  timerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: DarkColors.textTertiary,
    marginTop: 2,
  },
  timerButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timerBtnPause: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  timerBtnDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  timerBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* SMS Bubbles */
  smsContainer: {
    backgroundColor: DarkColors.surfaceInset,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.borderSubtle,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  smsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  smsHeaderText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: DarkColors.textTertiary,
  },
  smsBubble: {
    flexDirection: 'row',
    backgroundColor: DarkColors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  smsBubbleWarm: {
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  smsBubbleAccent: {
    width: 3,
    backgroundColor: Colors.primary,
  },
  smsBubbleText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: DarkColors.textSecondary,
    lineHeight: 19,
    padding: Spacing.md,
    flex: 1,
  },

  /* Calendar Week */
  calendarContainer: {
    backgroundColor: DarkColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: DarkColors.border,
    padding: Spacing.base,
    gap: Spacing.base,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarDay: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  calendarDayLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: DarkColors.textTertiary,
  },
  calendarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  streakRow: {
    alignItems: 'center',
  },
  streakText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
});

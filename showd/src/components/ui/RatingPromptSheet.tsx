import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { openPlayStoreRating } from '../../services/ratingPrompt';
import type { RatingTriggerResult } from '../../store/ratingStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 340;
const DISMISS_THRESHOLD = 100;

interface RatingPromptSheetProps {
  trigger: RatingTriggerResult;
  onRate: () => void;
  onDismiss: () => void;
}

function getContent(trigger: RatingTriggerResult): {
  title: string;
  body: string;
  cta: string;
} {
  switch (trigger.trigger) {
    case 'streak_3':
    case 'streak_7':
    case 'streak_14':
      return {
        title: `${trigger.streakCount} Day Streak!`,
        body: `You've shown up ${trigger.streakCount} days in a row. That's genuinely impressive.`,
        cta: 'If Showd is helping you, a quick rating means the world to an indie developer.',
      };
    case 'task_milestone':
      return {
        title: 'Enjoying Showd?',
        body: `You've completed ${trigger.taskCount} tasks. Takes 30 seconds. Means a lot.`,
        cta: 'If this app is helping, a rating helps us help more people.',
      };
    case 'struggle_then_complete':
      return {
        title: 'You showed up anyway',
        body: "You struggled, but you showed up anyway. That's what Showd is for.",
        cta: 'If this helped, a rating helps us help more people.',
      };
    default:
      return {
        title: 'Enjoying Showd?',
        body: "You're building real consistency.",
        cta: 'A quick rating means the world to an indie developer.',
      };
  }
}

export function RatingPromptSheet({
  trigger,
  onRate,
  onDismiss,
}: RatingPromptSheetProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue(0);

  const content = getContent(trigger);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    backdropOpacity.value = withTiming(1, { duration: 300 });
  }, [translateY, backdropOpacity]);

  const dismiss = () => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(onDismiss, 260);
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = context.value + event.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.5,
  }));

  const handleRate = async () => {
    onRate();
    await openPlayStoreRating();
  };

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{content.title}</Text>

          {/* Body */}
          <Text style={styles.body}>{content.body}</Text>

          {/* CTA context */}
          <Text style={styles.ctaText}>{content.cta}</Text>

          {/* Rate button */}
          <TouchableOpacity
            style={styles.rateButton}
            onPress={handleRate}
            activeOpacity={0.8}
          >
            <Feather name="star" size={20} color={Colors.surface} />
            <Text style={styles.rateButtonText}>Rate on Play Store</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity onPress={dismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Not right now</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerText}>Won't bug you for 5 days</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    ...Shadows.lg,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  ctaText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  rateButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});

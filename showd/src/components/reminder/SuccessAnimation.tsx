import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { useCompletedStreak, useHideSuccess } from '../../store/reminderStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STREAK_MILESTONES = [7, 14, 30, 60, 90];

export function SuccessAnimation() {
  const streak = useCompletedStreak();
  const hideSuccess = useHideSuccess();

  const isMilestone = streak !== null && STREAK_MILESTONES.includes(streak);

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    checkOpacity.value = 1;
    checkScale.value = withSpring(1, {
      damping: 8,
      stiffness: 150,
      mass: 0.5,
    });

    const timeout = setTimeout(() => {
      hideSuccess();
    }, isMilestone ? 2500 : 1500);

    return () => clearTimeout(timeout);
  }, [checkScale, checkOpacity, hideSuccess, isMilestone]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
    >
      {/* Checkmark circle */}
      <Animated.View style={[styles.checkCircle, checkAnimatedStyle]}>
        <Feather name="check" size={64} color="#FFFFFF" />
      </Animated.View>

      {/* Streak milestone */}
      {isMilestone && streak !== null && (
        <Animated.View
          entering={FadeIn.delay(400).duration(300)}
          style={styles.milestoneContainer}
        >
          <Feather name="zap" size={28} color={Colors.snooze} />
          <Text style={styles.milestoneText}>{streak} Day Streak!</Text>
        </Animated.View>
      )}

      {/* Simple "Done" text for non-milestones */}
      {!isMilestone && (
        <Animated.View entering={FadeIn.delay(300).duration(200)}>
          <Text style={styles.doneText}>Done!</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  milestoneText: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  doneText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    color: '#FFFFFF',
  },
});

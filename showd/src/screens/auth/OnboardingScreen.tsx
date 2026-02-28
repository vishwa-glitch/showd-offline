import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import type { OnboardingScreenProps } from '../../types/navigation';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    icon: 'smartphone' as const,
    iconBg: Colors.primaryLight,
    title: 'Tasks that demand your attention',
    description:
      'Showd takes over your screen at reminder time. No swiping away. No ignoring.',
  },
  {
    icon: 'check-circle' as const,
    iconBg: Colors.successLight,
    title: 'Three honest choices',
    description:
      'Complete it, delay it, or be honest about it. Every response is valid.',
  },
  {
    icon: 'trending-up' as const,
    iconBg: Colors.snoozeLight,
    title: 'Track your consistency',
    description:
      'Build streaks, see your progress, and prove to yourself what you can do.',
  },
];

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const isLastPage = currentPage === PAGES.length - 1;

  const goNext = () => {
    if (isLastPage) {
      navigation.navigate('NameSetup');
    } else {
      pagerRef.current?.setPage(currentPage + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipRow}>
        <Button
          label="Skip"
          onPress={() => navigation.navigate('NameSetup')}
          variant="text"
          textStyle={styles.skipText}
        />
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {PAGES.map((page, index) => (
          <View key={index} style={styles.page}>
            <View style={[styles.illustration, { backgroundColor: page.iconBg }]}>
              <Feather name={page.icon} size={64} color={Colors.primary} />
            </View>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </PagerView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {PAGES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentPage && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Button
          label={isLastPage ? "Let's Go" : 'Next'}
          onPress={goNext}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  skipText: {
    color: Colors.textSecondary,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  illustration: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.base,
  },
});

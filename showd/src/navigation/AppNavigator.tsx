import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useHasCompletedOnboarding } from '../store/onboardingStore';
import { AuthStack } from './AuthStack';
import { RootStack } from './RootStack';
import { ReminderOverlay } from '../components/reminder/ReminderOverlay';

export function AppNavigator() {
  const hasCompletedOnboarding = useHasCompletedOnboarding();

  return (
    <NavigationContainer>
      {hasCompletedOnboarding ? <RootStack /> : <AuthStack />}
      <ReminderOverlay />
    </NavigationContainer>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useIsAuthenticated } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { RootStack } from './RootStack';
import { ReminderOverlay } from '../components/reminder/ReminderOverlay';

export function AppNavigator() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootStack /> : <AuthStack />}
      <ReminderOverlay />
    </NavigationContainer>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { NameSetupScreen } from '../screens/auth/NameSetupScreen';
import { PermissionSetupScreen } from '../screens/auth/PermissionSetupScreen';

import type { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="NameSetup" component={NameSetupScreen} />
      <Stack.Screen name="PermissionSetup" component={PermissionSetupScreen} />
    </Stack.Navigator>
  );
}

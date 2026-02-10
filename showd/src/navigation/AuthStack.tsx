import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { PhoneInputScreen } from '../screens/auth/PhoneInputScreen';
import { OTPVerifyScreen } from '../screens/auth/OTPVerifyScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { PermissionSetupScreen } from '../screens/auth/PermissionSetupScreen';
import { OEMBatterySetupScreen } from '../screens/auth/OEMBatterySetupScreen';
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
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="PermissionSetup" component={PermissionSetupScreen} />
      <Stack.Screen name="OEMBatterySetup" component={OEMBatterySetupScreen} />
    </Stack.Navigator>
  );
}

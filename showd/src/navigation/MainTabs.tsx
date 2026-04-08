import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TodayScreen } from '../screens/main/TodayScreen';
import { ProgressScreen } from '../screens/main/ProgressScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { Colors } from '../utils/colors';
import { FontFamily } from '../utils/typography';
import { Spacing } from '../utils/spacing';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;
  const tabBarPaddingBottom = Spacing.sm + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : tabBarPaddingBottom,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

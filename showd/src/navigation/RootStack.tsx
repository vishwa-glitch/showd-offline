import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { CreateTaskScreen } from '../screens/modals/CreateTaskScreen';
import { EditTaskScreen } from '../screens/modals/EditTaskScreen';
import { TaskDetailScreen } from '../screens/main/TaskDetailScreen';
import { FocusTimerScreen } from '../screens/main/FocusTimerScreen';
import { HowShowdWorksScreen } from '../screens/settings/HowShowdWorksScreen';
import { SnoozeLimitScreen } from '../screens/settings/SnoozeLimitScreen';
import { ReminderSoundScreen } from '../screens/settings/ReminderSoundScreen';
import { SendFeedbackScreen } from '../screens/settings/SendFeedbackScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/settings/TermsOfServiceScreen';
import { Colors } from '../utils/colors';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="FocusTimer"
        component={FocusTimerScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
          contentStyle: { backgroundColor: 'rgba(15, 10, 20, 0.95)' },
        }}
      />
      <Stack.Screen
        name="HowShowdWorks"
        component={HowShowdWorksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SnoozeLimit"
        component={SnoozeLimitScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReminderSound"
        component={ReminderSoundScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SendFeedback"
        component={SendFeedbackScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

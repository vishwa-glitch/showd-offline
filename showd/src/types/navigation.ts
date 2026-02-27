import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  NameSetup: undefined;
  PermissionSetup: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreateTask: undefined;
  EditTask: { taskId: string };
  TaskDetail: { taskId: string };
  FocusTimer: { taskId: string; taskEventId: string };
  HowShowdWorks: undefined;
  SnoozeLimit: undefined;
  ReminderSound: undefined;
  SendFeedback: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  NotificationDebug: undefined;
};

// Screen prop types
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type OnboardingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type NameSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'NameSetup'>;
export type PermissionSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'PermissionSetup'>;

export type TodayScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Today'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type ProgressScreenProps = BottomTabScreenProps<MainTabParamList, 'Progress'>;
export type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type CreateTaskScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateTask'>;
export type EditTaskScreenProps = NativeStackScreenProps<RootStackParamList, 'EditTask'>;
export type TaskDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;
export type FocusTimerScreenProps = NativeStackScreenProps<RootStackParamList, 'FocusTimer'>;
export type HowShowdWorksScreenProps = NativeStackScreenProps<RootStackParamList, 'HowShowdWorks'>;
export type SnoozeLimitScreenProps = NativeStackScreenProps<RootStackParamList, 'SnoozeLimit'>;
export type ReminderSoundScreenProps = NativeStackScreenProps<RootStackParamList, 'ReminderSound'>;
export type SendFeedbackScreenProps = NativeStackScreenProps<RootStackParamList, 'SendFeedback'>;
export type PrivacyPolicyScreenProps = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;
export type TermsOfServiceScreenProps = NativeStackScreenProps<RootStackParamList, 'TermsOfService'>;
export type NotificationDebugScreenProps = NativeStackScreenProps<RootStackParamList, 'NotificationDebug'>;

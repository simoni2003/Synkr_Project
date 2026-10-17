import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SkillSelection } from '../types/api';

export type TabParamList = {
  Feed: undefined;
  Discover: undefined;
  Messages: undefined;
  Agenda: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // Sem sessão
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  // Sessão iniciada, onboarding por completar (também usado para editar competências)
  OnboardingTeach: undefined;
  OnboardingLearn: { teach: SkillSelection[] };
  // App
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  UserProfile: { userId: string };
  MatchRequests: undefined;
  TimeBank: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Premium: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

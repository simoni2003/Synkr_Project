import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { colors } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/ui';
import MainTabs from './MainTabs';

import Welcome from '../screens/auth/Welcome';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import VerifyEmail from '../screens/auth/VerifyEmail';
import ForgotPassword from '../screens/auth/ForgotPassword';
import ResetPassword from '../screens/auth/ResetPassword';
import OnboardingTeach from '../screens/onboarding/OnboardingTeach';
import OnboardingLearn from '../screens/onboarding/OnboardingLearn';
import UserProfile from '../screens/stack/UserProfile';
import MatchRequests from '../screens/stack/MatchRequests';
import TimeBank from '../screens/stack/TimeBank';
import EditProfile from '../screens/stack/EditProfile';
import Settings from '../screens/stack/Settings';
import Premium from '../screens/stack/Premium';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <Logo size={56} />
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export default function RootNavigator() {
  const { status, user } = useAuth();

  if (status === 'loading') return <Splash />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {status === 'signedOut' ? (
        // 1) Sem sessão
        <>
          <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ title: '' }} />
          <Stack.Screen name="Register" component={Register} options={{ title: '' }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmail} options={{ title: '' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: '' }} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ title: '' }} />
        </>
      ) : !user?.onboardingCompleted ? (
        // 2) Sessão iniciada mas ainda sem competências escolhidas
        <>
          <Stack.Screen name="OnboardingTeach" component={OnboardingTeach} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="OnboardingLearn" component={OnboardingLearn} options={{ headerShown: false }} />
        </>
      ) : (
        // 3) App principal
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="UserProfile" component={UserProfile} options={{ title: 'Perfil' }} />
          <Stack.Screen name="MatchRequests" component={MatchRequests} options={{ title: 'Pedidos de troca' }} />
          <Stack.Screen name="TimeBank" component={TimeBank} options={{ title: 'Banco de tempo' }} />
          <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Editar perfil' }} />
          <Stack.Screen name="Settings" component={Settings} options={{ title: 'Definições' }} />
          <Stack.Screen name="Premium" component={Premium} options={{ title: 'Synkr Pro' }} />
          {/* Editar competências reutiliza o onboarding */}
          <Stack.Screen name="OnboardingTeach" component={OnboardingTeach} options={{ headerShown: false }} />
          <Stack.Screen name="OnboardingLearn" component={OnboardingLearn} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

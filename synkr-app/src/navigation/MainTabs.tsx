import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { TabParamList } from './types';
import { colors } from '../theme';
import { makeComingSoon } from '../screens/ComingSoon';
import Profile from '../screens/tabs/Profile';
import Discover from '../screens/tabs/Discover';

const Tab = createBottomTabNavigator<TabParamList>();

// Estas secções ficam à espera do backend das respetivas fases (sem dados simulados)
const Feed = makeComingSoon({ title: 'Início', phase: 'Fase 7', icon: 'home-outline', text: 'O feed de progresso da rede aparece aqui quando houver publicações reais.' });
const Messages = makeComingSoon({ title: 'Mensagens', phase: 'Fase 4', icon: 'chatbubbles-outline', text: 'As tuas conversas em tempo real aparecem aqui.' });
const Agenda = makeComingSoon({ title: 'Agenda', phase: 'Fase 5', icon: 'calendar-outline', text: 'Sessões pendentes, confirmadas e histórico.' });

const icons: Record<keyof TabParamList, [string, string]> = {
  Feed: ['home', 'home-outline'],
  Discover: ['search', 'search-outline'],
  Messages: ['chatbubbles', 'chatbubbles-outline'],
  Agenda: ['calendar', 'calendar-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={(focused ? icons[route.name][0] : icons[route.name][1]) as any} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Feed" component={Feed} options={{ title: 'Início' }} />
      <Tab.Screen name="Discover" component={Discover} options={{ title: 'Descobrir' }} />
      <Tab.Screen name="Messages" component={Messages} options={{ title: 'Mensagens' }} />
      <Tab.Screen name="Agenda" component={Agenda} options={{ title: 'Agenda' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

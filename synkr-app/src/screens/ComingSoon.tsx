import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, IconName } from '../components/ui';
import { colors, t } from '../theme';

type Config = { title: string; phase: string; text: string; icon: IconName };

/** Ecrã provisório para secções cujo backend ainda não existe (não mostra dados inventados). */
export function makeComingSoon({ title, phase, text, icon }: Config) {
  return function ComingSoon() {
    return (
      <Screen scroll={false} edges={['top']} contentStyle={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={38} color={colors.primary} />
        </View>
        <Text style={[t.h1, { marginTop: 22, textAlign: 'center' }]}>{title}</Text>
        <Text style={[t.muted, { marginTop: 8, textAlign: 'center' }]}>{text}</Text>
        <View style={{ marginTop: 18, backgroundColor: colors.accentSoft, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 }}>
          <Text style={{ color: '#9A4B0E', fontWeight: '700', fontSize: 13 }}>Backend: {phase}</Text>
        </View>
      </Screen>
    );
  };
}

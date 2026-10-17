import React from 'react';
import { View, Text } from 'react-native';
import { Screen, Button, Logo } from '../../components/ui';
import { useNav } from '../../navigation/useNav';
import { t } from '../../theme';

export default function Welcome() {
  const nav = useNav();
  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentStyle={{ justifyContent: 'space-between', paddingHorizontal: 24 }}>
      <View style={{ alignItems: 'center', marginTop: 90 }}>
        <Logo size={72} />
        <Text style={[t.h1, { fontSize: 38, marginTop: 28 }]}>Synkr</Text>
        <Text style={[t.muted, { textAlign: 'center', marginTop: 10, maxWidth: 300 }]}>
          Ensina o que sabes, aprende o que queres. Cada hora que ensinas vale uma hora de aula.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <Button label="Criar conta" onPress={() => nav.navigate('Register')} />
        <Button label="Já tenho conta" variant="secondary" onPress={() => nav.navigate('Login')} />
      </View>
    </Screen>
  );
}

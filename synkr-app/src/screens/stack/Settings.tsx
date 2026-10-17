import React from 'react';
import { View } from 'react-native';
import { Screen, Card, ListRow, Button } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { useNav } from '../../navigation/useNav';

export default function Settings() {
  const nav = useNav();
  const { user, signOut } = useAuth();
  return (
    <Screen>
      <Card>
        <ListRow icon="mail-outline" title="E-mail" subtitle={user?.email ?? ''} />
        <ListRow icon="create-outline" title="Editar perfil" onPress={() => nav.navigate('EditProfile')} />
        <ListRow icon="star-outline" title="Synkr Pro" subtitle="Em breve" onPress={() => nav.navigate('Premium')} />
      </Card>
      <View style={{ marginTop: 8 }}>
        <Button variant="danger" icon="log-out-outline" label="Terminar sessão" onPress={signOut} />
      </View>
    </Screen>
  );
}

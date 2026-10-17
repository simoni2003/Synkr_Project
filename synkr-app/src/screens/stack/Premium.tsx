import React from 'react';
import { Text } from 'react-native';
import { Screen, Card, ListRow, Button } from '../../components/ui';
import { t } from '../../theme';

export default function Premium() {
  return (
    <Screen footer={<Button label="Avisar-me quando estiver disponível" />}>
      <Text style={t.h1}>Synkr Pro</Text>
      <Text style={[t.muted, { marginTop: 6, marginBottom: 20 }]}>Tudo o que já usas continua gratuito. O Pro chega numa fase posterior.</Text>
      <Card>
        <ListRow icon="trending-up" title="Perfil em destaque" subtitle="Aparece primeiro nas pesquisas" />
        <ListRow icon="checkmark-circle-outline" title="Emblema verificado" />
        <ListRow icon="stats-chart-outline" title="Relatórios de progresso" subtitle="Análises avançadas da tua aprendizagem" />
        <ListRow icon="cloud-upload-outline" title="Gravação de sessões" subtitle="Revê as aulas na nuvem" />
        <ListRow icon="cash-outline" title="Sessões pagas" subtitle="Para especialistas seniores" />
      </Card>
    </Screen>
  );
}

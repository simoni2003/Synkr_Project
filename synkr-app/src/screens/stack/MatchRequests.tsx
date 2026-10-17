import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar, Button, Card, ErrorText, Screen, Segmented } from '../../components/ui';
import { compatLabel } from '../../components/UserCardView';
import { apiError } from '../../services/api';
import { matchesService } from '../../services/matches.service';
import { useNav } from '../../navigation/useNav';
import type { MatchBox, MatchView } from '../../types/api';
import { colors, t } from '../../theme';

const TABS = ['Recebidos', 'Enviados', 'Ligações'];
const BOX: Record<string, MatchBox> = { Recebidos: 'incoming', Enviados: 'outgoing', Ligações: 'accepted' };
const EMPTY: Record<string, string> = {
  Recebidos: 'Ainda não recebeste pedidos de troca.',
  Enviados: 'Não tens pedidos pendentes. Pede uma troca a partir do perfil de alguém compatível.',
  Ligações: 'Ainda não estás ligado a ninguém. Quando alguém aceitar o teu pedido (ou tu aceitares um), aparece aqui.',
};

export default function MatchRequests() {
  const nav = useNav();
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState<MatchView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (which: string) => {
    setError(null);
    try {
      setItems(await matchesService.list(BOX[which]));
    } catch (e) {
      setError(apiError(e));
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(tab);
    }, [load, tab]),
  );

  const switchTab = (v: string) => {
    setItems(null);
    setTab(v);
  };

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await load(tab);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen>
      <Segmented options={TABS} value={tab} onChange={switchTab} />
      <View style={{ height: 16 }} />
      <ErrorText>{error}</ErrorText>
      {items === null ? <ActivityIndicator color={colors.primary} /> : null}
      {items && items.length === 0 && !error ? <Text style={t.muted}>{EMPTY[tab]}</Text> : null}

      {items?.map((m) => (
        <Card key={m.id} onPress={() => nav.navigate('UserProfile', { userId: m.user.id })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={m.user.name} />
            <View style={{ flex: 1 }}>
              <Text style={t.h3} numberOfLines={1}>{m.user.name}</Text>
              <Text style={t.small} numberOfLines={1}>{compatLabel[m.user.compatibility.type]}</Text>
            </View>
          </View>
          {tab === 'Recebidos' ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button small variant="secondary" label="Recusar" style={{ flex: 1 }} loading={busyId === m.id} onPress={() => act(m.id, () => matchesService.decline(m.id))} />
              <Button small label="Aceitar" style={{ flex: 1 }} loading={busyId === m.id} onPress={() => act(m.id, () => matchesService.accept(m.id))} />
            </View>
          ) : null}
          {tab === 'Enviados' ? (
            <Button small variant="secondary" label="Cancelar pedido" style={{ marginTop: 14 }} loading={busyId === m.id} onPress={() => act(m.id, () => matchesService.cancel(m.id))} />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

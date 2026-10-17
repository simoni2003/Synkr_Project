import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Avatar, Button, Card, Chip, ChipRow, ErrorText, InfoText, Screen, SectionTitle } from '../../components/ui';
import { compatLabel } from '../../components/UserCardView';
import { apiError } from '../../services/api';
import { discoverService } from '../../services/discover.service';
import { matchesService } from '../../services/matches.service';
import { useParams } from '../../navigation/useNav';
import { levelLabel, UserCard } from '../../types/api';
import { colors, t } from '../../theme';

export default function UserProfile() {
  const { userId } = useParams<'UserProfile'>();
  const [card, setCard] = useState<UserCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCard(await discoverService.user(userId));
    } catch (e) {
      setError(apiError(e));
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!card) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
        {!error ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
      </Screen>
    );
  }

  const c = card.compatibility;
  const rel = card.relation;
  const sub = [card.handle, card.city].filter(Boolean).join(' - ');

  let footer: React.ReactNode;
  if (!rel || (rel.status === 'DECLINED' && rel.direction === 'INCOMING')) {
    footer =
      c.type === 'NONE' ? (
        <Text style={[t.muted, { textAlign: 'center' }]}>Não têm competências compatíveis para trocar.</Text>
      ) : (
        <Button label="Pedir troca" icon="swap-horizontal" loading={busy} onPress={() => act(() => matchesService.request(card.id))} />
      );
  } else if (rel.status === 'SUGGESTED' && rel.direction === 'OUTGOING') {
    footer = (
      <>
        <Button label="Pedido enviado" variant="secondary" disabled />
        <Button label="Cancelar pedido" variant="ghost" loading={busy} onPress={() => act(() => matchesService.cancel(rel.matchId))} />
      </>
    );
  } else if (rel.status === 'SUGGESTED') {
    footer = (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Recusar" variant="secondary" style={{ flex: 1 }} loading={busy} onPress={() => act(() => matchesService.decline(rel.matchId))} />
        <Button label="Aceitar" style={{ flex: 1 }} loading={busy} onPress={() => act(() => matchesService.accept(rel.matchId))} />
      </View>
    );
  } else if (rel.status === 'ACCEPTED') {
    footer = <Button label="Ligados" icon="checkmark-circle" variant="secondary" disabled />;
  } else {
    footer = <Text style={[t.muted, { textAlign: 'center' }]}>Esta pessoa recusou o teu pedido.</Text>;
  }

  return (
    <Screen footer={footer}>
      <View style={{ alignItems: 'center' }}>
        <Avatar name={card.name} size={88} />
        <Text style={[t.h1, { marginTop: 12, textAlign: 'center' }]}>{card.name}</Text>
        <Text style={t.small}>{sub}</Text>
        {card.headline ? <Text style={[t.muted, { textAlign: 'center', marginTop: 8 }]}>{card.headline}</Text> : null}
        {card.bio ? <Text style={[t.body, { textAlign: 'center', marginTop: 10 }]}>{card.bio}</Text> : null}
      </View>

      <View style={{ height: 16 }} />
      <ErrorText>{error}</ErrorText>
      {rel?.status === 'ACCEPTED' ? <InfoText>Estão ligados. O chat chega numa próxima fase.</InfoText> : null}

      {c.type !== 'NONE' ? (
        <Card style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            <Chip label={compatLabel[c.type]} selected tone={c.type === 'MUTUAL' ? 'primary' : 'accent'} />
          </View>
          {c.youCanLearn.length ? (
            <Text style={[t.body, { marginTop: 12 }]}>
              <Text style={{ fontWeight: '700' }}>Podes aprender: </Text>
              {c.youCanLearn.map((s) => `${s.name} (${levelLabel[s.level]})`).join(', ')}
            </Text>
          ) : null}
          {c.theyCanLearn.length ? (
            <Text style={[t.body, { marginTop: 8 }]}>
              <Text style={{ fontWeight: '700' }}>Quer aprender contigo: </Text>
              {c.theyCanLearn.map((s) => s.name).join(', ')}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <SectionTitle title="Ensina" />
      <ChipRow>{card.teach.map((s) => <Chip key={s.skillId} label={`${s.name} (${levelLabel[s.level]})`} selected />)}</ChipRow>
      <SectionTitle title="Quer aprender" />
      <ChipRow>{card.learn.map((s) => <Chip key={s.skillId} label={`${s.name} (${levelLabel[s.level]})`} tone="accent" selected />)}</ChipRow>
    </Screen>
  );
}

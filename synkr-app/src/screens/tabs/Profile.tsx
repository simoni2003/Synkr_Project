import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Avatar, Card, Chip, ChipRow, Button, IconButton, ListRow, SectionTitle } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { creditsService } from '../../services/credits.service';
import { matchesService } from '../../services/matches.service';
import { useNav } from '../../navigation/useNav';
import { levelLabel } from '../../types/api';
import type { CreditSummary, MatchSummary } from '../../types/api';
import { formatMinutes } from '../../utils/format';
import { colors, t } from '../../theme';

export default function Profile() {
  const nav = useNav();
  const { user, refreshUser } = useAuth();
  const [credits, setCredits] = useState<CreditSummary | null>(null);
  const [matches, setMatches] = useState<MatchSummary | null>(null);

  // Recarrega dados reais do backend sempre que o separador fica visível
  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshUser().catch(() => {});
      creditsService.balance().then((c) => active && setCredits(c)).catch(() => {});
      matchesService.summary().then((m) => active && setMatches(m)).catch(() => {});
      return () => {
        active = false;
      };
    }, [refreshUser]),
  );

  if (!user) return null;
  const sub = [user.handle, user.city].filter(Boolean).join(' - ');

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
        <IconButton name="settings-outline" onPress={() => nav.navigate('Settings')} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Avatar name={user.name} size={88} />
        <Text style={[t.h1, { marginTop: 12, textAlign: 'center' }]}>{user.name}</Text>
        <Text style={t.small}>{sub}</Text>
        {user.headline ? <Text style={[t.muted, { textAlign: 'center', marginTop: 8 }]}>{user.headline}</Text> : null}
        {user.bio ? <Text style={[t.body, { textAlign: 'center', marginTop: 10 }]}>{user.bio}</Text> : null}
      </View>

      <Card
        onPress={() => nav.navigate('TimeBank')}
        style={{ backgroundColor: colors.accentSoft, borderColor: colors.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}
      >
        <Ionicons name="time" size={28} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={t.h3}>{credits ? `Saldo: ${formatMinutes(credits.balanceMinutes)}` : 'Banco de tempo'}</Text>
          <Text style={t.small}>
            {credits ? `Ensinadas ${formatMinutes(credits.taughtMinutes)} - Aprendidas ${formatMinutes(credits.learnedMinutes)}` : 'Os teus créditos de tempo'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>

      <ListRow
        icon="people-outline"
        title="Pedidos e ligações"
        subtitle={matches ? `${matches.incoming} recebidos - ${matches.accepted} ligações` : undefined}
        onPress={() => nav.navigate('MatchRequests')}
      />

      <SectionTitle title="Ensino" />
      <ChipRow>
        {user.teach.map((s) => <Chip key={s.skillId} label={`${s.name} (${levelLabel[s.level]})`} selected />)}
      </ChipRow>

      <SectionTitle title="Quero aprender" />
      <ChipRow>
        {user.learn.map((s) => <Chip key={s.skillId} label={`${s.name} (${levelLabel[s.level]})`} tone="accent" selected />)}
      </ChipRow>

      <Button label="Editar perfil" variant="secondary" icon="create-outline" style={{ marginTop: 28 }} onPress={() => nav.navigate('EditProfile')} />
    </Screen>
  );
}

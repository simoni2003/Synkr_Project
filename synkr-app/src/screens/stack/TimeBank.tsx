import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, ErrorText, ListRow, Screen, SectionTitle, Stat } from '../../components/ui';
import { apiError } from '../../services/api';
import { creditsService } from '../../services/credits.service';
import type { CreditReason, CreditSummary, CreditTransaction } from '../../types/api';
import { formatDate, formatMinutes, formatSigned } from '../../utils/format';
import { colors, t } from '../../theme';

const PAGE = 20;

function describe(tx: CreditTransaction): { title: string; subtitle: string } {
  const date = formatDate(tx.createdAt);
  const s = tx.session;
  const titles: Record<CreditReason, string> = {
    SESSION_TAUGHT: s ? `Ensinaste ${s.skillName}` : 'Aula ensinada',
    SESSION_LEARNED: s ? `Aprendeste ${s.skillName}` : 'Aula aprendida',
    SIGNUP_BONUS: 'Crédito de boas-vindas',
    ADJUSTMENT: 'Ajuste',
  };
  return { title: titles[tx.reason], subtitle: s ? `com ${s.withUser.name} - ${date}` : date };
}

export default function TimeBank() {
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [items, setItems] = useState<CreditTransaction[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, p] = await Promise.all([creditsService.balance(), creditsService.transactions({ limit: PAGE, offset: 0 })]);
      setSummary(s);
      setItems(p.items);
      setTotal(p.total);
    } catch (e) {
      setError(apiError(e));
      setItems((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const more = async () => {
    if (!items) return;
    setLoadingMore(true);
    try {
      const p = await creditsService.transactions({ limit: PAGE, offset: items.length });
      setItems([...items, ...p.items]);
      setTotal(p.total);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Screen>
      <ErrorText>{error}</ErrorText>
      <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary, alignItems: 'center', paddingVertical: 28 }}>
        <Text style={{ color: '#BFE3E1', fontWeight: '600' }}>Saldo disponível</Text>
        {summary ? (
          <Text style={{ color: '#fff', fontSize: 46, fontWeight: '800', marginVertical: 4 }}>{formatMinutes(summary.balanceMinutes)}</Text>
        ) : (
          <ActivityIndicator color="#fff" style={{ marginVertical: 18 }} />
        )}
        <Text style={{ color: '#BFE3E1' }}>1 hora ensinada = 1 crédito</Text>
      </Card>

      {summary ? (
        <Card style={{ flexDirection: 'row' }}>
          <Stat value={formatMinutes(summary.taughtMinutes)} label="Ensinadas" />
          <Stat value={formatMinutes(summary.learnedMinutes)} label="Aprendidas" />
        </Card>
      ) : null}

      <SectionTitle title="Como funciona" />
      <Card>
        <ListRow icon="school-outline" title="Ensinas 1 hora" subtitle="Ganhas 1 crédito de tempo" />
        <ListRow icon="book-outline" title="Aprendes 1 hora" subtitle="Gastas 1 crédito de tempo" />
      </Card>

      <SectionTitle title="Movimentos" />
      {items === null ? <ActivityIndicator color={colors.primary} /> : null}
      {items && items.length === 0 && !error ? <Text style={t.muted}>Ainda não tens movimentos.</Text> : null}
      {items?.map((tx) => {
        const d = describe(tx);
        const positive = tx.minutes > 0;
        return (
          <ListRow
            key={tx.id}
            title={d.title}
            subtitle={d.subtitle}
            left={<Ionicons name={positive ? 'arrow-down-circle' : 'arrow-up-circle'} size={34} color={positive ? colors.success : colors.accent} />}
            right={<Text style={[t.h3, { color: positive ? colors.success : colors.accent }]}>{formatSigned(tx.minutes)}</Text>}
          />
        );
      })}
      {items && items.length < total ? <Button variant="secondary" label="Ver mais" loading={loadingMore} onPress={more} /> : null}
    </Screen>
  );
}

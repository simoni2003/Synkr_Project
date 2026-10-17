import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Chip, CreditPill, ErrorText, Field, IconButton, Screen, SectionTitle } from '../../components/ui';
import UserCardView from '../../components/UserCardView';
import { apiError } from '../../services/api';
import { creditsService } from '../../services/credits.service';
import { discoverService } from '../../services/discover.service';
import { matchesService } from '../../services/matches.service';
import { skillsService } from '../../services/skills.service';
import { useNav } from '../../navigation/useNav';
import { levelLabel, Paged, SkillLevel, UserCard } from '../../types/api';
import { formatMinutes } from '../../utils/format';
import { colors, t } from '../../theme';

const PAGE = 15;
const LEVELS: SkillLevel[] = ['INTERMEDIATE', 'ADVANCED'];

export default function Discover() {
  const nav = useNav();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Todas');
  const [level, setLevel] = useState<SkillLevel | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [sugg, setSugg] = useState<Paged<UserCard> | null>(null);
  const [results, setResults] = useState<UserCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [incoming, setIncoming] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const reqId = useRef(0);

  const filtersActive = query.trim() !== '' || cat !== 'Todas' || level !== null;

  // Pesquisa (com pequena espera enquanto escreves). Ignora respostas antigas.
  const fetchResults = async (offset: number, append: boolean) => {
    const id = ++reqId.current;
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const page = await discoverService.search({
        q: query.trim() || undefined,
        category: cat !== 'Todas' ? cat : undefined,
        level: level ?? undefined,
        limit: PAGE,
        offset,
      });
      if (id !== reqId.current) return;
      setResults((prev) => (append ? [...prev, ...page.items] : page.items));
      setTotal(page.total);
    } catch (e) {
      if (id === reqId.current) setError(apiError(e));
    } finally {
      if (id === reqId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const h = setTimeout(() => fetchResults(0, false), query ? 350 : 0);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cat, level]);

  useEffect(() => {
    skillsService
      .list()
      .then((list) => setCategories(Array.from(new Set(list.map((s) => s.category)))))
      .catch(() => {});
  }, []);

  // Sugestões, pedidos recebidos e saldo: recarregam sempre que o separador fica visível
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.allSettled([discoverService.suggestions({ limit: 10 }), matchesService.summary(), creditsService.balance()]).then(
        ([s, m, c]) => {
          if (!active) return;
          if (s.status === 'fulfilled') setSugg(s.value);
          if (m.status === 'fulfilled') setIncoming(m.value.incoming);
          if (c.status === 'fulfilled') setBalance(c.value.balanceMinutes);
        },
      );
      return () => {
        active = false;
      };
    }, []),
  );

  const open = (c: UserCard) => nav.navigate('UserProfile', { userId: c.id });

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={t.h1}>Descobrir</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {balance !== null ? <CreditPill label={formatMinutes(balance)} onPress={() => nav.navigate('TimeBank')} /> : null}
          <IconButton name="people-outline" badge={incoming > 0} onPress={() => nav.navigate('MatchRequests')} />
        </View>
      </View>

      <Field icon="search" value={query} onChangeText={setQuery} placeholder="Procurar competência ou pessoa" autoCorrect={false} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
        {['Todas', ...categories].map((c) => (
          <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="Qualquer nível" selected={level === null} onPress={() => setLevel(null)} />
        {LEVELS.map((l) => (
          <Chip key={l} label={levelLabel[l]} selected={level === l} onPress={() => setLevel(l)} />
        ))}
      </ScrollView>

      {!filtersActive ? (
        <>
          <SectionTitle title="Compatíveis contigo" />
          {sugg === null ? <ActivityIndicator color={colors.primary} /> : null}
          {sugg && sugg.items.length === 0 ? (
            <Text style={t.muted}>
              Ainda não há perfis compatíveis. Aparecem aqui quando alguém ensina o que queres aprender, ou quer aprender o que ensinas.
            </Text>
          ) : null}
          {sugg?.items.map((c) => <UserCardView key={c.id} card={c} onPress={() => open(c)} />)}
        </>
      ) : null}

      <SectionTitle title={filtersActive ? `Resultados (${total})` : 'Explorar quem ensina'} />
      <ErrorText>{error}</ErrorText>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && !error && results.length === 0 ? (
        <Text style={t.muted}>{filtersActive ? 'Nada encontrado com estes filtros.' : 'Ainda não há mais pessoas na rede.'}</Text>
      ) : null}
      {results.map((c) => <UserCardView key={c.id} card={c} onPress={() => open(c)} />)}
      {results.length < total ? (
        <Button variant="secondary" label="Ver mais" loading={loadingMore} onPress={() => fetchResults(results.length, true)} />
      ) : null}
    </Screen>
  );
}

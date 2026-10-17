import React from 'react';
import { View, Text } from 'react-native';
import { Avatar, Card, Chip, ChipRow } from './ui';
import type { CompatType, UserCard } from '../types/api';
import { colors, t } from '../theme';

export const compatLabel: Record<CompatType, string> = {
  MUTUAL: 'Troca direta',
  TEACHES_YOU: 'Ensina o que queres',
  LEARNS_FROM_YOU: 'Quer o que ensinas',
  NONE: 'Sem match',
};

const names = (list: { name: string }[]) => list.map((s) => s.name).join(', ');

export function relationHint(card: UserCard): string | null {
  const r = card.relation;
  if (!r) return null;
  if (r.status === 'ACCEPTED') return 'Ligados';
  if (r.status === 'SUGGESTED') return r.direction === 'OUTGOING' ? 'Pedido enviado' : 'Quer trocar contigo';
  return null;
}

export default function UserCardView({ card, onPress }: { card: UserCard; onPress: () => void }) {
  const c = card.compatibility;
  const hint = relationHint(card);
  const sub = [card.headline, card.city].filter(Boolean).join(' - ');
  const shown = card.teach.slice(0, 4);

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={card.name} size={50} />
        <View style={{ flex: 1 }}>
          <Text style={t.h3} numberOfLines={1}>{card.name}</Text>
          {sub ? <Text style={t.small} numberOfLines={1}>{sub}</Text> : null}
        </View>
        {hint ? <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{hint}</Text> : null}
      </View>

      {c.type !== 'NONE' ? (
        <View style={{ marginTop: 12, gap: 6 }}>
          <View style={{ flexDirection: 'row' }}>
            <Chip label={compatLabel[c.type]} selected tone={c.type === 'MUTUAL' ? 'primary' : 'accent'} />
          </View>
          {c.youCanLearn.length ? <Text style={t.small}>Podes aprender: <Text style={{ color: colors.ink, fontWeight: '600' }}>{names(c.youCanLearn)}</Text></Text> : null}
          {c.theyCanLearn.length ? <Text style={t.small}>Quer aprender contigo: <Text style={{ color: colors.ink, fontWeight: '600' }}>{names(c.theyCanLearn)}</Text></Text> : null}
        </View>
      ) : null}

      <View style={{ marginTop: 12 }}>
        <Text style={[t.small, { marginBottom: 6 }]}>Ensina</Text>
        <ChipRow>
          {shown.map((s) => <Chip key={s.skillId} label={s.name} />)}
          {card.teach.length > shown.length ? <Chip label={`+${card.teach.length - shown.length}`} /> : null}
        </ChipRow>
      </View>
    </Card>
  );
}

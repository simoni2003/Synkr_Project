import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, ChipRow, ErrorText, Screen } from './ui';
import { skillsService } from '../services/skills.service';
import { apiError } from '../services/api';
import { levelLabel, Skill, SkillLevel, SkillSelection } from '../types/api';
import { colors, t } from '../theme';

type Props = {
  mode: 'teach' | 'learn';
  step: number;
  title: string;
  subtitle: string;
  /** seleção inicial (ao editar competências) */
  initial?: SkillSelection[];
  /** competências que não podem ser escolhidas (já escolhidas no outro lado) */
  exclude?: string[];
  busy?: boolean;
  error?: string | null;
  nextLabel?: string;
  backLabel?: string;
  onNext: (selection: SkillSelection[]) => void;
  onBack?: () => void;
};

export default function SkillPicker({
  mode, step, title, subtitle, initial = [], exclude = [], busy, error, nextLabel = 'Continuar', backLabel = 'Voltar', onNext, onBack,
}: Props) {
  const levels: SkillLevel[] = mode === 'teach' ? ['INTERMEDIATE', 'ADVANCED'] : ['BEGINNER', 'INTERMEDIATE'];
  const accent = mode === 'teach' ? 'primary' : 'accent';

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, SkillLevel>>(() =>
    Object.fromEntries(initial.filter((i) => !exclude.includes(i.skillId)).map((i) => [i.skillId, i.level])),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await skillsService.list();
      setSkills(list);
      setCat((c) => c ?? list[0]?.category ?? null);
    } catch (e) {
      setLoadError(apiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(skills.map((s) => s.category))), [skills]);
  const visible = skills.filter((s) => s.category === cat && !exclude.includes(s.id));
  const pickedIds = Object.keys(picked);
  const nameOf = (id: string) => skills.find((s) => s.id === id)?.name ?? '...';

  const toggle = (id: string) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[id]) delete next[id];
      else next[id] = levels[0];
      return next;
    });

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <>
          <Button
            label={nextLabel}
            disabled={pickedIds.length === 0 || !!loadError}
            loading={busy}
            onPress={() => onNext(pickedIds.map((skillId) => ({ skillId, level: picked[skillId] })))}
          />
          {onBack ? <Button label={backLabel} variant="ghost" onPress={onBack} /> : null}
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
        {[1, 2].map((n) => (
          <View key={n} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: n <= step ? colors.primary : colors.line }} />
        ))}
      </View>
      <Text style={t.h1}>{title}</Text>
      <Text style={[t.muted, { marginTop: 6, marginBottom: 20 }]}>{subtitle}</Text>
      <ErrorText>{error}</ErrorText>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {loadError ? (
        <View>
          <ErrorText>{loadError}</ErrorText>
          <Button label="Tentar de novo" variant="secondary" onPress={load} />
        </View>
      ) : null}

      {!loading && !loadError ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
            {categories.map((c) => (
              <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />
            ))}
          </ScrollView>
          <ChipRow>
            {visible.map((s) => (
              <Chip key={s.id} label={s.name} selected={!!picked[s.id]} tone={accent} icon={picked[s.id] ? 'checkmark' : undefined} onPress={() => toggle(s.id)} />
            ))}
          </ChipRow>

          {pickedIds.length > 0 ? (
            <View style={{ marginTop: 24 }}>
              <Text style={[t.h3, { marginBottom: 10 }]}>O teu nível em cada uma</Text>
              {pickedIds.map((id) => (
                <Card key={id}>
                  <Text style={[t.h3, { marginBottom: 10 }]}>{nameOf(id)}</Text>
                  <ChipRow>
                    {levels.map((l) => (
                      <Chip key={l} label={levelLabel[l]} selected={picked[id] === l} tone={accent} onPress={() => setPicked((p) => ({ ...p, [id]: l }))} />
                    ))}
                  </ChipRow>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

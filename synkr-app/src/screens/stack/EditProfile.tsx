import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, Avatar, Button, ErrorText, Field, Chip, ChipRow, SectionTitle } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { apiError } from '../../services/api';
import { useNav } from '../../navigation/useNav';
import { levelLabel } from '../../types/api';

export default function EditProfile() {
  const nav = useNav();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const save = async () => {
    if (name.trim().length < 2) return setError('O nome deve ter pelo menos 2 caracteres.');
    setError(null);
    setLoading(true);
    try {
      await updateProfile({ name: name.trim(), headline: headline.trim(), city: city.trim(), bio: bio.trim() });
      nav.goBack();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen footer={<Button label="Guardar alterações" loading={loading} onPress={save} />}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Avatar name={name || user.name} size={88} />
      </View>
      <ErrorText>{error}</ErrorText>
      <Field label="Nome" value={name} onChangeText={setName} />
      <Field label="Apresentação" value={headline} onChangeText={setHeadline} placeholder="Ex.: Developer mobile, a aprender design" maxLength={120} />
      <Field label="Cidade" value={city} onChangeText={setCity} maxLength={80} />
      <Field label="Sobre ti" multiline value={bio} onChangeText={setBio} placeholder="Conta um pouco sobre ti" maxLength={500} />

      <SectionTitle title="Ensino" />
      <ChipRow>{user.teach.map((s) => <Chip key={s.skillId} label={`${s.name} (${levelLabel[s.level]})`} selected />)}</ChipRow>
      <SectionTitle title="Quero aprender" />
      <ChipRow>{user.learn.map((s) => <Chip key={s.skillId} label={`${s.name} (${levelLabel[s.level]})`} tone="accent" selected />)}</ChipRow>
      <Button variant="secondary" icon="swap-horizontal" label="Editar competências" style={{ marginTop: 16 }} onPress={() => nav.navigate('OnboardingTeach')} />
    </Screen>
  );
}

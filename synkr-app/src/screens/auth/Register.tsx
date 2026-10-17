import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { Screen, Button, Field, ErrorText } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { apiError } from '../../services/api';
import { useNav } from '../../navigation/useNav';
import { colors, t } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const nav = useNav();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const mail = email.trim().toLowerCase();
    if (name.trim().length < 2) return setError('Indica o teu nome.');
    if (!EMAIL_RE.test(mail)) return setError('E-mail inválido.');
    if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) {
      return setError('A palavra-passe deve ter pelo menos 8 caracteres, com letras e números.');
    }
    setError(null);
    setLoading(true);
    try {
      await register(name.trim(), mail, pass);
      nav.navigate('VerifyEmail', { email: mail });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={t.h1}>Criar conta</Text>
      <Text style={[t.muted, { marginBottom: 24, marginTop: 6 }]}>Vamos enviar um código de confirmação para o teu e-mail.</Text>
      <ErrorText>{error}</ErrorText>
      <Field label="Nome" icon="person-outline" value={name} onChangeText={setName} placeholder="O teu nome" />
      <Field label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="nome@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Palavra-passe" icon="lock-closed-outline" value={pass} onChangeText={setPass} placeholder="Mínimo 8 caracteres, com letras e números" secureTextEntry />
      <Button label="Continuar" loading={loading} onPress={submit} style={{ marginTop: 8 }} />
      <Pressable onPress={() => nav.replace('Login')} style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={t.muted}>Já tens conta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Iniciar sessão</Text></Text>
      </Pressable>
    </Screen>
  );
}

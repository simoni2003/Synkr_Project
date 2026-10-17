import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { Screen, Button, Field, ErrorText } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { apiError, isEmailNotVerified } from '../../services/api';
import { useNav } from '../../navigation/useNav';
import { colors, t } from '../../theme';

export default function Login() {
  const nav = useNav();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail || !pass) return setError('Preenche o e-mail e a palavra-passe.');
    setError(null);
    setLoading(true);
    try {
      await signIn(mail, pass); // se correr bem, a navegação muda sozinha
    } catch (e) {
      if (isEmailNotVerified(e)) nav.navigate('VerifyEmail', { email: mail });
      else setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={t.h1}>Iniciar sessão</Text>
      <Text style={[t.muted, { marginBottom: 24, marginTop: 6 }]}>Bem-vindo de volta. Continua a tua troca de competências.</Text>
      <ErrorText>{error}</ErrorText>
      <Field label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="nome@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Palavra-passe" icon="lock-closed-outline" value={pass} onChangeText={setPass} placeholder="A tua palavra-passe" secureTextEntry />
      <Pressable onPress={() => nav.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Esqueci a palavra-passe</Text>
      </Pressable>
      <Button label="Entrar" loading={loading} onPress={submit} />
      <Pressable onPress={() => nav.replace('Register')} style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={t.muted}>Ainda não tens conta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Criar conta</Text></Text>
      </Pressable>
    </Screen>
  );
}

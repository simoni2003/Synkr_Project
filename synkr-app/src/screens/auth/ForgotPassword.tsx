import React, { useState } from 'react';
import { Text } from 'react-native';
import { Screen, Button, Field, ErrorText } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { apiError } from '../../services/api';
import { useNav } from '../../navigation/useNav';
import { t } from '../../theme';

export default function ForgotPassword() {
  const nav = useNav();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) return setError('Indica o e-mail da tua conta.');
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(mail);
      nav.navigate('ResetPassword', { email: mail });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={t.h1}>Recuperar palavra-passe</Text>
      <Text style={[t.muted, { marginBottom: 24, marginTop: 6 }]}>Indica o e-mail da tua conta e enviamos um código para criares uma nova palavra-passe.</Text>
      <ErrorText>{error}</ErrorText>
      <Field label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="nome@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Button label="Enviar código" loading={loading} onPress={submit} />
    </Screen>
  );
}

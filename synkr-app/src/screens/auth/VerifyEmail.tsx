import React, { useState } from 'react';
import { Text } from 'react-native';
import { Screen, Button, Field, ErrorText, InfoText } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { apiError } from '../../services/api';
import { useParams } from '../../navigation/useNav';
import { t } from '../../theme';

export default function VerifyEmail() {
  const { email } = useParams<'VerifyEmail'>();
  const { verifyEmail, resendCode } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async () => {
    if (code.trim().length !== 6) return setError('O código tem 6 dígitos.');
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await verifyEmail(email, code.trim()); // sucesso: segue sozinho para o onboarding
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setResending(true);
    try {
      await resendCode(email);
      setInfo('Enviámos um novo código.');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <Text style={t.h1}>Confirma o teu e-mail</Text>
      <Text style={[t.muted, { marginBottom: 24, marginTop: 6 }]}>Introduz o código de 6 dígitos enviado para {email}.</Text>
      {__DEV__ ? <Text style={[t.small, { marginBottom: 12 }]}>Em desenvolvimento, o código aparece no terminal do backend.</Text> : null}
      <ErrorText>{error}</ErrorText>
      <InfoText>{info}</InfoText>
      <Field icon="keypad-outline" value={code} onChangeText={setCode} placeholder="000000" keyboardType="number-pad" maxLength={6} />
      <Button label="Confirmar" loading={loading} onPress={submit} />
      <Button label="Reenviar código" variant="ghost" loading={resending} onPress={resend} style={{ marginTop: 8 }} />
    </Screen>
  );
}

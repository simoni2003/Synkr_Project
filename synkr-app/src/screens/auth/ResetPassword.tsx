import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Screen, Button, Field, ErrorText } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { apiError } from '../../services/api';
import { useNav, useParams } from '../../navigation/useNav';
import { t } from '../../theme';

export default function ResetPassword() {
  const { email } = useParams<'ResetPassword'>();
  const nav = useNav();
  const { resetPassword } = useAuth();
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.trim().length !== 6) return setError('O código tem 6 dígitos.');
    if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) {
      return setError('A palavra-passe deve ter pelo menos 8 caracteres, com letras e números.');
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email, code.trim(), pass);
      Alert.alert('Palavra-passe atualizada', 'Já podes iniciar sessão.', [{ text: 'OK', onPress: () => nav.popTo('Login') }]);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={t.h1}>Nova palavra-passe</Text>
      <Text style={[t.muted, { marginBottom: 24, marginTop: 6 }]}>Introduz o código enviado para {email} e escolhe a nova palavra-passe.</Text>
      {__DEV__ ? <Text style={[t.small, { marginBottom: 12 }]}>Em desenvolvimento, o código aparece no terminal do backend.</Text> : null}
      <ErrorText>{error}</ErrorText>
      <Field label="Código" icon="keypad-outline" value={code} onChangeText={setCode} placeholder="000000" keyboardType="number-pad" maxLength={6} />
      <Field label="Nova palavra-passe" icon="lock-closed-outline" value={pass} onChangeText={setPass} placeholder="Mínimo 8 caracteres, com letras e números" secureTextEntry />
      <Button label="Guardar palavra-passe" loading={loading} onPress={submit} />
    </Screen>
  );
}

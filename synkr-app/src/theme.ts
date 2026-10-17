import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#F2F5F6',
  surface: '#FFFFFF',
  ink: '#12232E',
  muted: '#647783',
  line: '#DFE6EA',
  primary: '#0B6E6E',
  primaryDark: '#084F4F',
  primarySoft: '#DCEFEE',
  accent: '#F28C38',
  accentSoft: '#FDEBDA',
  success: '#2E9E6B',
  successSoft: '#DDF3E8',
  danger: '#D64545',
  dangerSoft: '#FBE4E4',
  night: '#0B1418',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 };
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

export const t = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  muted: { fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontSize: 13, color: colors.muted },
});

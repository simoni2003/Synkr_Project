import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, TextInputProps, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, t } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* Ecrã base: safe area + scroll opcional + rodapé fixo opcional */
export function Screen({
  children, scroll = true, edges = ['bottom'], style, contentStyle, footer,
}: {
  children: ReactNode; scroll?: boolean; edges?: Edge[];
  style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ padding: space.lg, paddingBottom: space.xxl }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding: space.lg }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Button({
  label, onPress, variant = 'primary', icon, small, disabled, loading, style,
}: {
  label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  icon?: IconName; small?: boolean; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const bg = { primary: colors.primary, secondary: colors.surface, ghost: 'transparent', danger: colors.dangerSoft, accent: colors.accent }[variant];
  const fg = { primary: '#fff', secondary: colors.ink, ghost: colors.primary, danger: colors.danger, accent: '#fff' }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn, small && { paddingVertical: 9, paddingHorizontal: 14 },
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed || loading ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.line },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 14 : 16 }}>{label}</Text>
    </Pressable>
  );
}

const avatarColors = ['#0B6E6E', '#F28C38', '#5B6CFF', '#C2456B', '#2E9E6B', '#8A5CF6'];
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const bg = avatarColors[(name.charCodeAt(0) + name.length) % avatarColors.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function Chip({
  label, selected, onPress, icon, tone = 'primary',
}: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; tone?: 'primary' | 'accent' }) {
  const on = tone === 'accent' ? colors.accent : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[s.chip, selected && { backgroundColor: on, borderColor: on }]}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? '#fff' : colors.muted} /> : null}
      <Text style={{ color: selected ? '#fff' : colors.ink, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

export function Field({ label, icon, ...rest }: { label?: string; icon?: IconName } & TextInputProps) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? <Text style={[t.small, { marginBottom: 6, fontWeight: '600' }]}>{label}</Text> : null}
      <View style={[s.field, rest.multiline && { alignItems: 'flex-start' }]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={rest.multiline ? { marginTop: 14 } : undefined} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          {...rest}
          style={[{ flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 13 }, rest.multiline && { minHeight: 110, textAlignVertical: 'top' }]}
        />
      </View>
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, marginBottom: space.md }}>
      <Text style={{ color: colors.danger, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function InfoText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: space.md, marginBottom: space.md }}>
      <Text style={{ color: colors.success, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[s.card, style]}>
      {children}
    </Wrapper>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.md }}>
      <Text style={t.h2}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ListRow({
  icon, left, title, subtitle, onPress, right, danger,
}: { icon?: IconName; left?: ReactNode; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      {left ?? (icon ? (
        <View style={[s.rowIcon, danger && { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
        </View>
      ) : null)}
      <View style={{ flex: 1 }}>
        <Text style={[t.h3, danger && { color: colors.danger }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={t.small} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.segment}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.segItem, value === o && s.segOn]}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: value === o ? colors.ink : colors.muted }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function CreditPill({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.credit}>
      <Ionicons name="time" size={15} color={colors.accent} />
      <Text style={{ color: '#9A4B0E', fontWeight: '800', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Ionicons name="star" size={size} color={colors.accent} />
      <Text style={{ fontSize: size, fontWeight: '700', color: colors.ink }}>{value.toFixed(1)}</Text>
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={t.h2}>{value}</Text>
      <Text style={t.small}>{label}</Text>
    </View>
  );
}

/* Marca: dois anéis que se cruzam = troca */
export function Logo({ size = 64 }: { size?: number }) {
  const ring = { width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.14 };
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={[ring, { borderColor: colors.primary }]} />
      <View style={[ring, { borderColor: colors.accent, marginLeft: -size * 0.36 }]} />
    </View>
  );
}

export function IconButton({ name, onPress, badge }: { name: IconName; onPress?: () => void; badge?: boolean }) {
  return (
    <Pressable onPress={onPress} style={s.iconBtn} hitSlop={6}>
      <Ionicons name={name} size={20} color={colors.ink} />
      {badge ? <View style={s.dot} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  footer: { padding: space.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 20, borderRadius: radius.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.line, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', backgroundColor: '#E4EAED', borderRadius: radius.md, padding: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm + 2 },
  segOn: { backgroundColor: colors.surface },
  credit: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accentSoft, paddingVertical: 6, paddingHorizontal: 11, borderRadius: radius.pill },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});

import React, { PropsWithChildren, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme, radius, shadow, space } from '../theme';

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create({
    button: { minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, marginVertical: space.xs },
    primary: { backgroundColor: colors.primary }, secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
    danger: { backgroundColor: colors.danger }, quiet: { backgroundColor: 'transparent' },
    buttonText: { fontSize: 15, fontWeight: '700', color: colors.ink }, lightText: { color: colors.onPrimary },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.5 },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.lg, marginVertical: space.sm, ...shadow },
    titleWrap: { marginTop: space.md, marginBottom: space.md }, title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, color: colors.ink },
    muted: { fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: space.xs },
    label: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: space.md, marginBottom: space.xs },
    field: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.fieldSurface, paddingHorizontal: space.md, fontSize: 16, color: colors.ink },
    pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
    pill_green: { backgroundColor: colors.primarySoft }, pill_amber: { backgroundColor: colors.warningSoft }, pill_red: { backgroundColor: colors.dangerSoft },
    pillText: { fontSize: 12, fontWeight: '700' }, pillText_green: { color: colors.primary }, pillText_amber: { color: colors.amberText }, pillText_red: { color: colors.danger },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  }), [colors]);
}

export function useUi() {
  const { colors } = useTheme();
  return { section: { marginTop: space.xl, marginBottom: space.sm }, personName: { fontSize: 16, fontWeight: '700' as const, color: colors.ink }, separator: { height: 1, backgroundColor: colors.line, marginVertical: space.md }, full: { width: '100%' as const } };
}

export function Button({ title, onPress, variant = 'primary', disabled = false, style }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'quiet'; disabled?: boolean; style?: ViewStyle }) {
  const styles = useStyles();
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, styles[variant], style, pressed && styles.pressed, disabled && styles.disabled]}><Text style={[styles.buttonText, variant === 'primary' || variant === 'danger' ? styles.lightText : null]}>{title}</Text></Pressable>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) { const styles = useStyles(); return <View style={[styles.card, style]}>{children}</View>; }
export function Title({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) { const styles = useStyles(); return <View style={styles.titleWrap}><Text style={styles.title}>{children}</Text>{subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}</View>; }
export function Label({ children }: PropsWithChildren) { const styles = useStyles(); return <Text style={styles.label}>{children}</Text>; }
export function Field(props: TextInputProps) { const styles = useStyles(); const { colors } = useTheme(); return <TextInput {...props} placeholderTextColor={colors.muted} accessibilityLabel={props.accessibilityLabel ?? props.placeholder} style={[styles.field, props.style]} />; }
export function Muted({ children }: PropsWithChildren) { const styles = useStyles(); return <Text style={styles.muted}>{children}</Text>; }
export function Pill({ children, tone = 'green' }: PropsWithChildren<{ tone?: 'green' | 'amber' | 'red' }>) { const styles = useStyles(); const pairs: Record<'green' | 'amber' | 'red', [ViewStyle, TextStyle]> = { green: [styles.pill_green, styles.pillText_green], amber: [styles.pill_amber, styles.pillText_amber], red: [styles.pill_red, styles.pillText_red] }; const pair = pairs[tone]; return <View style={[styles.pill, pair[0]]}><Text style={[styles.pillText, pair[1]]}>{children}</Text></View>; }
export function Loading() { const styles = useStyles(); const { colors } = useTheme(); return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>; }
export function Row({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) { const styles = useStyles(); return <View style={[styles.row, style]}>{children}</View>; }

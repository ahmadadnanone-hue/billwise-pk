// Small reusable pieces of the interface, so every screen looks the same.

import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { DueStatus } from '@/lib/dates';

export const colors = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E3E7EF',
  text: '#111827',
  muted: '#6B7280',
  primary: '#0B6E4F',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  dangerBg: '#FEE4E2',
  warn: '#B54708',
  warnBg: '#FEF0C7',
  ok: '#067647',
  okBg: '#DCFAE6',
  info: '#175CD3',
  infoBg: '#D1E9FF',
};

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const isOff = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (pressed || isOff) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && { color: colors.primary },
            variant === 'danger' && { color: colors.danger },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const STATUS_COLORS: Record<DueStatus, { bg: string; fg: string }> = {
  paid: { bg: colors.okBg, fg: colors.ok },
  overdue: { bg: colors.dangerBg, fg: colors.danger },
  today: { bg: colors.dangerBg, fg: colors.danger },
  soon: { bg: colors.warnBg, fg: colors.warn },
  upcoming: { bg: colors.infoBg, fg: colors.info },
  unknown: { bg: colors.border, fg: colors.muted },
};

export function StatusPill({ status, label }: { status: DueStatus; label: string }) {
  const c = STATUS_COLORS[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  error: { fontSize: 13, color: colors.danger, lineHeight: 18 },
  amount: { fontSize: 26, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
  buttonDanger: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});

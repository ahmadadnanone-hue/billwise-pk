import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBills } from '@/lib/BillContext';
import { getDaysUntilDue, getStatus, STATUS_STYLES } from '@/lib/helpers';
import { colors } from '@/lib/theme';

const ICON_MAP: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  electricity: 'bolt', gas: 'fire', internet: 'globe',
  water: 'tint', phone: 'mobile', school: 'graduation-cap',
};

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function RemindersScreen() {
  const { bills, toggleReminder } = useBills();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>🔔 Bill Reminders</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Reminder List */}
        <View style={s.card}>
          {bills.map((bill, i) => {
            const iconName = ICON_MAP[bill.id] || 'bolt';
            const days = getDaysUntilDue(bill.dueDay);
            const status = getStatus(bill);
            const ss = STATUS_STYLES[status];

            return (
              <View
                key={bill.id}
                style={[
                  s.row,
                  i > 0 && s.rowBorder,
                  status === 'urgent' && { backgroundColor: colors.dangerBg + '11' },
                ]}
              >
                <FontAwesome name={iconName} size={16} color={bill.color} style={{ width: 24 }} />
                <View style={s.rowInfo}>
                  <Text style={s.rowLabel}>{bill.label}</Text>
                  <Text style={s.rowSub}>
                    Due on the <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{ordinal(bill.dueDay)}</Text> of each month
                    {bill.amount > 0 && ` · Rs. ${bill.amount.toLocaleString()}`}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {bill.paidThisMonth ? (
                    <View style={[s.badge, { backgroundColor: colors.successBg }]}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.successText }}>PAID ✓</Text>
                    </View>
                  ) : (
                    <View style={[s.badge, { backgroundColor: ss.bg }]}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: ss.text }}>
                        {days === 0 ? 'TODAY!' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.toggleBtn, bill.reminder ? s.toggleOn : s.toggleOff]}
                    onPress={() => toggleReminder(bill.id)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: bill.reminder ? colors.accent : colors.textDim }}>
                      {bill.reminder ? '🔔 ON' : '🔕 OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Due Calendar */}
        <View style={s.card}>
          <View style={s.calHeader}>
            <Text style={s.calTitle}>📅 THIS MONTH'S DUE CALENDAR</Text>
          </View>
          {[...bills].sort((a, b) => a.dueDay - b.dueDay).map(bill => {
            const iconName = ICON_MAP[bill.id] || 'bolt';
            return (
              <View key={bill.id} style={s.calRow}>
                <Text style={s.calDay}>{bill.dueDay}</Text>
                <View style={[s.calLine, { backgroundColor: bill.color + '44' }]} />
                <FontAwesome name={iconName} size={14} color={bill.color} />
                <Text style={s.calLabel}>{bill.label}</Text>
                {bill.paidThisMonth && (
                  <Text style={s.calPaid}>✓ paid</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  title: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },

  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, overflow: 'hidden', marginBottom: 20 },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  rowInfo: { flex: 1 },
  rowLabel: { fontWeight: '600', fontSize: 13, color: colors.text },
  rowSub: { fontSize: 11, color: colors.textDim, marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  toggleBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  toggleOn: { backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accent },
  toggleOff: { backgroundColor: colors.cardBorder, borderWidth: 1, borderColor: colors.textDark },

  calHeader: { paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  calTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 8 },
  calDay: { width: 30, textAlign: 'right', fontSize: 11, color: colors.textDim },
  calLine: { width: 2, height: 20, borderRadius: 1 },
  calLabel: { fontSize: 12, color: colors.textMuted, flex: 1 },
  calPaid: { fontSize: 10, color: colors.successText },
});

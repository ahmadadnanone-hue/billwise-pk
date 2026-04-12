import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBills } from '@/lib/BillContext';
import { colors } from '@/lib/theme';

const ICON_MAP: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  electricity: 'bolt', gas: 'fire', internet: 'globe',
  water: 'tint', phone: 'mobile', school: 'graduation-cap',
};

export default function HistoryScreen() {
  const { bills, deleteHistory } = useBills();

  const hasAnyHistory = bills.some(b => b.history && b.history.length > 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>📊 Monthly Bill History</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {!hasAnyHistory && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyText}>No history yet. Add some bills from the Dashboard first!</Text>
          </View>
        )}

        {bills.map(bill => {
          if (!bill.history || bill.history.length === 0) return null;
          const iconName = ICON_MAP[bill.id] || 'bolt';
          const sorted = [...bill.history].sort((a, b) => {
            const da = new Date(`${a.month} ${a.year}`);
            const db = new Date(`${b.month} ${b.year}`);
            return db.getTime() - da.getTime();
          });
          const maxAmount = Math.max(...sorted.map(h => h.amount), 1);

          return (
            <View key={bill.id} style={s.card}>
              {/* Card Header */}
              <View style={s.cardHeader}>
                <FontAwesome name={iconName} size={16} color={bill.color} />
                <Text style={s.cardTitle}>{bill.label}</Text>
                <Text style={s.recordCount}>{bill.history.length} records</Text>
              </View>

              {/* Records */}
              {sorted.map((h, i) => (
                <View key={i} style={[s.row, i > 0 && s.rowBorder]}>
                  <Text style={s.rowMonth}>{h.month} {h.year}</Text>
                  <Text style={s.rowAmount}>
                    {h.amount > 0 ? `Rs. ${h.amount.toLocaleString()}` : '—'}
                  </Text>
                  <Text style={s.rowUsage}>{h.usage > 0 ? String(h.usage) : '—'}</Text>
                  <View style={[s.paidBadge, { backgroundColor: h.paid ? colors.successBg : colors.cardBorder }]}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: h.paid ? colors.successText : colors.textDim }}>
                      {h.paid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => deleteHistory(bill.id, bill.history.indexOf(h))}
                  >
                    <FontAwesome name="trash-o" size={12} color={colors.dangerText} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Mini Bar Chart */}
              {sorted.length > 1 && (
                <View style={s.chartSection}>
                  <Text style={s.chartLabel}>AMOUNT TREND</Text>
                  <View style={s.chartRow}>
                    {sorted.slice(0, 6).reverse().map((h, i) => {
                      const pct = maxAmount > 0 ? (h.amount / maxAmount) * 100 : 0;
                      return (
                        <View key={i} style={s.chartCol}>
                          <View style={[s.chartBar, { height: Math.max(pct * 0.4, 2), backgroundColor: bill.color + '88' }]} />
                          <Text style={s.chartBarLabel}>{h.month.substring(0, 3)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}
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
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: colors.textDark, fontSize: 14, textAlign: 'center' },

  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  cardTitle: { fontWeight: '600', fontSize: 14, color: colors.text, flex: 1 },
  recordCount: { fontSize: 11, color: colors.textDim },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  rowMonth: { width: 70, fontSize: 12, color: colors.textMuted },
  rowAmount: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text },
  rowUsage: { width: 40, fontSize: 12, color: colors.textDim, textAlign: 'right' },
  paidBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },

  chartSection: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  chartLabel: { fontSize: 10, color: colors.textDim, letterSpacing: 0.5, marginBottom: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 50 },
  chartCol: { flex: 1, alignItems: 'center', gap: 3 },
  chartBar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartBarLabel: { fontSize: 8, color: colors.textDim },
});

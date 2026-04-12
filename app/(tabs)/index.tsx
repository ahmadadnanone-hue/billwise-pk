import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBills } from '@/lib/BillContext';
import { BILL_TYPES } from '@/lib/config';
import { getDaysUntilDue, getStatus, STATUS_STYLES } from '@/lib/helpers';
import { colors } from '@/lib/theme';
import { Bill } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  electricity: 'bolt',
  gas: 'fire',
  internet: 'globe',
  water: 'tint',
  phone: 'mobile',
  school: 'graduation-cap',
};

export default function DashboardScreen() {
  const { bills, loading, updateBillEntry, markPaid } = useBills();
  const [modalBill, setModalBill] = useState<Bill | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formUsage, setFormUsage] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Loading your bills...</Text>
      </View>
    );
  }

  const totalThisMonth = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const unpaidCount = bills.filter(b => !b.paidThisMonth && b.amount > 0).length;
  const trackedCount = bills.filter(b => b.amount > 0).length;
  const urgentBills = bills.filter(b => !b.paidThisMonth && getDaysUntilDue(b.dueDay) <= 7);

  const openEntry = (bill: Bill) => {
    setFormAmount(bill.amount ? String(bill.amount) : '');
    setFormUsage(bill.usage ? String(bill.usage) : '');
    setFormNotes(bill.notes || '');
    setModalBill(bill);
  };

  const saveEntry = () => {
    if (!modalBill) return;
    updateBillEntry(
      modalBill.id,
      parseFloat(formAmount) || 0,
      parseFloat(formUsage) || 0,
      formNotes || undefined,
    );
    setModalBill(null);
  };

  const today = new Date();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>
            <Text style={{ color: colors.accent }}>⚡</Text> BillWise PK
          </Text>
          <Text style={s.date}>
            {today.toLocaleDateString('en-PK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={s.headerRight}>
          {urgentBills.length > 0 && (
            <View style={s.urgentBadge}>
              <Text style={s.urgentBadgeText}>
                🔔 {urgentBills.length} urgent
              </Text>
            </View>
          )}
          <View style={s.totalBadge}>
            <Text style={s.totalBadgeText}>
              Rs. {totalThisMonth.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Summary Cards */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>THIS MONTH</Text>
            <Text style={[s.summaryValue, { color: colors.accent }]}>
              Rs. {totalThisMonth.toLocaleString()}
            </Text>
            <Text style={s.summarySub}>all utilities</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>UNPAID</Text>
            <Text style={[s.summaryValue, { color: colors.warning }]}>
              {unpaidCount}
            </Text>
            <Text style={s.summarySub}>need payment</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>TRACKED</Text>
            <Text style={[s.summaryValue, { color: colors.success }]}>
              {trackedCount}
            </Text>
            <Text style={s.summarySub}>of 6 utilities</Text>
          </View>
        </View>

        {/* Bill Cards */}
        {bills.map(bill => {
          const status = getStatus(bill);
          const ss = STATUS_STYLES[status];
          const days = getDaysUntilDue(bill.dueDay);
          const cfg = BILL_TYPES.find(t => t.id === bill.id);
          const iconName = ICON_MAP[bill.id] || 'bolt';

          return (
            <View
              key={bill.id}
              style={[
                s.billCard,
                status === 'urgent' && s.billCardUrgent,
              ]}
            >
              {/* Card Header */}
              <View style={s.cardHeader}>
                <View style={s.cardHeaderLeft}>
                  <View style={[s.iconCircle, { backgroundColor: bill.color + '22' }]}>
                    <FontAwesome name={iconName} size={18} color={bill.color} />
                  </View>
                  <View>
                    <Text style={s.billLabel}>{bill.label}</Text>
                    <Text style={s.billDue}>Due day {bill.dueDay} of month</Text>
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
                  <Text style={[s.statusText, { color: ss.text }]}>{ss.label}</Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={s.cardBody}>
                <View style={s.amountRow}>
                  <View>
                    <Text style={s.fieldLabel}>Amount</Text>
                    <Text style={[s.amountText, bill.amount <= 0 && { color: colors.textDark }]}>
                      {bill.amount > 0 ? `Rs. ${bill.amount.toLocaleString()}` : '—'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' as const }}>
                    <Text style={s.fieldLabel}>Usage</Text>
                    <Text style={s.usageText}>
                      {bill.usage > 0 ? `${bill.usage} ${cfg?.unit || ''}` : '—'}
                    </Text>
                  </View>
                </View>

                {!bill.paidThisMonth && bill.amount > 0 && (
                  <View style={s.dueInfo}>
                    <Text
                      style={[
                        s.dueInfoText,
                        { color: days <= 3 ? colors.dangerText : days <= 7 ? colors.warningText : colors.textDim },
                      ]}
                    >
                      ⏰ {days === 0 ? 'Due TODAY!' : days < 0 ? `Overdue by ${Math.abs(days)} days` : `Due in ${days} day${days !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                )}

                {bill.notes ? (
                  <View style={s.notePreview}>
                    <Text style={s.notePreviewText}>
                      📝 {bill.notes.substring(0, 60)}{bill.notes.length > 60 ? '...' : ''}
                    </Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={s.actionRow}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => openEntry(bill)}>
                    <Text style={s.actionBtnText}>
                      ✏️ {bill.amount > 0 ? 'Edit' : 'Add Bill'}
                    </Text>
                  </TouchableOpacity>
                  {bill.amount > 0 && !bill.paidThisMonth && (
                    <TouchableOpacity
                      style={[s.actionBtn, s.actionBtnPaid]}
                      onPress={() => markPaid(bill.id)}
                    >
                      <Text style={[s.actionBtnText, { color: colors.successText }]}>
                        ✅ Paid
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Entry Modal */}
      <Modal visible={!!modalBill} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>📋 Add / Update Bill</Text>
              <TouchableOpacity onPress={() => setModalBill(null)}>
                <FontAwesome name="times" size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <View style={s.modalBody}>
              <Text style={s.inputLabel}>BILL AMOUNT (RS.)</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                placeholder="e.g. 4500"
                placeholderTextColor={colors.textDark}
                value={formAmount}
                onChangeText={setFormAmount}
              />

              <Text style={s.inputLabel}>
                USAGE ({BILL_TYPES.find(t => t.id === modalBill?.id)?.unit || 'units'})
              </Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                placeholder="e.g. 320"
                placeholderTextColor={colors.textDark}
                value={formUsage}
                onChangeText={setFormUsage}
              />
              <Text style={s.inputHint}>
                (Optional) Enter your meter reading or data usage
              </Text>

              <Text style={s.inputLabel}>QUICK NOTE (OPTIONAL)</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. AC was running all month"
                placeholderTextColor={colors.textDark}
                value={formNotes}
                onChangeText={setFormNotes}
              />

              <TouchableOpacity style={s.saveBtn} onPress={saveEntry}>
                <Text style={s.saveBtnText}>Save Bill Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.textDim, marginTop: 12, fontSize: 14 },

  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { fontSize: 20, fontWeight: '700', color: colors.text },
  date: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urgentBadge: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentBadgeText: { fontSize: 11, color: colors.dangerText, fontWeight: '600' },
  totalBadge: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  totalBadgeText: { fontSize: 12, color: colors.accent, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
  },
  summaryLabel: { fontSize: 10, color: colors.textDim, letterSpacing: 1, marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  summarySub: { fontSize: 11, color: colors.textDark, marginTop: 2 },

  billCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  billCardUrgent: {
    borderColor: colors.dangerBg,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  billDue: { fontSize: 10, color: colors.textDim },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  cardBody: { padding: 16 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  fieldLabel: { fontSize: 10, color: colors.textDim, marginBottom: 3 },
  amountText: { fontSize: 22, fontWeight: '700', color: colors.text },
  usageText: { fontSize: 16, fontWeight: '600', color: colors.textMuted },

  dueInfo: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  dueInfoText: { fontSize: 11 },

  notePreview: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  notePreviewText: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    backgroundColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnPaid: { backgroundColor: colors.successBg },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  modalBody: { padding: 20 },
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  inputHint: { fontSize: 10, color: colors.textDim, marginTop: 4 },
  saveBtn: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});

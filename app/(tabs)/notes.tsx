import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBills } from '@/lib/BillContext';
import { colors } from '@/lib/theme';
import { Bill } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  electricity: 'bolt', gas: 'fire', internet: 'globe',
  water: 'tint', phone: 'mobile', school: 'graduation-cap',
};

export default function NotesScreen() {
  const { bills, updateBillNote } = useBills();
  const [modalBill, setModalBill] = useState<Bill | null>(null);
  const [noteText, setNoteText] = useState('');

  const openNote = (bill: Bill) => {
    setNoteText(bill.notes || '');
    setModalBill(bill);
  };

  const saveNote = () => {
    if (!modalBill) return;
    updateBillNote(modalBill.id, noteText);
    setModalBill(null);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>📝 Bill Notes</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {bills.map(bill => {
          const iconName = ICON_MAP[bill.id] || 'bolt';
          return (
            <View key={bill.id} style={s.card}>
              <View style={s.cardHeader}>
                <FontAwesome name={iconName} size={16} color={bill.color} />
                <Text style={s.cardTitle}>{bill.label}</Text>
              </View>
              <View style={s.noteBox}>
                <Text style={[s.noteText, !bill.notes && s.noteEmpty]}>
                  {bill.notes || 'No notes yet. Tap below to add.'}
                </Text>
              </View>
              <TouchableOpacity style={s.editBtn} onPress={() => openNote(bill)}>
                <Text style={s.editBtnText}>✏️ {bill.notes ? 'Edit Note' : 'Add Note'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Note Modal */}
      <Modal visible={!!modalBill} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>📝 {modalBill?.label}</Text>
              <TouchableOpacity onPress={() => setModalBill(null)}>
                <FontAwesome name="times" size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              <Text style={s.inputLabel}>YOUR NOTE</Text>
              <TextInput
                style={s.input}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder="Write anything useful... meter number, account number, provider info, etc."
                placeholderTextColor={colors.textDark}
                value={noteText}
                onChangeText={setNoteText}
              />
              <TouchableOpacity style={s.saveBtn} onPress={saveNote}>
                <Text style={s.saveBtnText}>Save Note</Text>
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
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  title: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },

  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { fontWeight: '600', fontSize: 13, color: colors.text },
  noteBox: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, padding: 12, minHeight: 70, marginBottom: 12 },
  noteText: { fontSize: 12, color: colors.textMuted, lineHeight: 20 },
  noteEmpty: { color: colors.textDark, fontStyle: 'italic' },
  editBtn: { backgroundColor: colors.cardBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' },
  editBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 13, minHeight: 120 },
  saveBtn: { backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});

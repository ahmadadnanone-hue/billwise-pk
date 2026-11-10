// "Enter a bill" screen: type this month's amount and due date by hand.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, colors, styles } from '@/components/ui';
import { useAccounts } from '@/lib/AccountsContext';
import { formatMonth, monthsAgo, parseTypedDate, toTypedDate } from '@/lib/dates';

/** "4,520" → 4520; empty → null; anything else → NaN (invalid). */
function readNumber(s: string): number | null {
  const t = s.replace(/[,\s]/g, '').replace(/^rs\.?/i, '');
  if (!t) return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

export default function EnterBill() {
  const { accountId, month: monthParam } = useLocalSearchParams<{ accountId: string; month?: string }>();
  const { accounts, saveManualBill } = useAccounts();
  const account = accounts.find((a) => a.id === accountId);

  // When editing, start from the saved bill for that month.
  const existing = account?.bills.find((b) => b.month === monthParam);
  const monthChoices = [monthsAgo(1), monthsAgo(0), monthsAgo(2)];
  if (existing && !monthChoices.includes(existing.month)) monthChoices.push(existing.month);

  const [month, setMonth] = useState(existing?.month ?? monthsAgo(1));
  const [amount, setAmount] = useState(existing?.amountDue != null ? String(existing.amountDue) : '');
  const [dueDate, setDueDate] = useState(toTypedDate(existing?.dueDate ?? null));
  const [lateAmount, setLateAmount] = useState(
    existing?.amountAfterDueDate != null ? String(existing.amountAfterDueDate) : '',
  );
  const [units, setUnits] = useState(existing?.unitsUsed != null ? String(existing.unitsUsed) : '');
  const [error, setError] = useState<string | null>(null);

  if (!account) {
    return (
      <View style={[styles.screen, styles.content]}>
        <Text style={styles.body}>This bill was deleted.</Text>
        <Button title="Back to all bills" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const save = () => {
    const amountDue = readNumber(amount);
    const due = parseTypedDate(dueDate);
    const after = readNumber(lateAmount);
    const used = readNumber(units);
    if (amountDue == null || Number.isNaN(amountDue)) return setError('Please enter the amount, e.g. 4520.');
    if (!due) return setError('Please enter the due date as day-month-year, e.g. 25-11-2026.');
    if (Number.isNaN(after)) return setError('The amount after due date should be a number, or left empty.');
    if (Number.isNaN(used)) return setError('Units should be a number, or left empty.');
    saveManualBill(account.id, {
      month,
      amountDue,
      amountAfterDueDate: after,
      dueDate: due,
      unitsUsed: used,
      source: 'manual',
      savedAt: new Date().toISOString(),
      paid: existing?.month === month ? existing.paid : false,
    });
    router.back();
  };

  const field = (
    label: string,
    value: string,
    onChange: (s: string) => void,
    placeholder: string,
    keyboard: 'number-pad' | 'numbers-and-punctuation' = 'number-pad',
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => {
          onChange(t);
          setError(null);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboard}
      />
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>For “{account.nickname}”. Copy these from your paper bill.</Text>

        <Text style={styles.label}>Which month is this bill for?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {monthChoices.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMonth(m)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: month === m ? colors.primary : colors.border,
                backgroundColor: month === m ? colors.okBg : colors.card,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: month === m ? '700' : '400' }}>{formatMonth(m)}</Text>
            </Pressable>
          ))}
        </View>

        {field('Amount payable within due date (Rs.)', amount, setAmount, 'e.g. 4520')}
        {field('Due date (day-month-year)', dueDate, setDueDate, 'e.g. 25-11-2026', 'numbers-and-punctuation')}
        {field('Amount after due date (optional)', lateAmount, setLateAmount, 'e.g. 4970')}
        {field('Units used (optional)', units, setUnits, 'e.g. 210')}

        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Save bill" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

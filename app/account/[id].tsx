// Details for one bill: latest bill, AI explanation, past months, paid ticks.

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import { Button, Card, Row, StatusPill, styles } from '@/components/ui';
import { useAccounts } from '@/lib/AccountsContext';
import { dueStatus, dueText, formatDate, formatMonth, formatRs } from '@/lib/dates';
import { canAutoFetch, getProvider } from '@/shared/providers';

function confirm(title: string, message: string, onYes: () => void) {
  // Pop-ups with buttons don't work in web browsers, so use the browser's own box there.
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onYes },
  ]);
}

export default function AccountDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accounts, checking, refreshAccount, removeAccount, setPaid } = useAccounts();
  const account = accounts.find((a) => a.id === id);

  if (!account) {
    return (
      <View style={[styles.screen, styles.content]}>
        <Text style={styles.body}>This bill was deleted.</Text>
        <Button title="Back to all bills" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const provider = getProvider(account.providerId);
  const isChecking = checking.includes(account.id);
  const [latest, ...older] = account.bills;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: account.nickname }} />

      <Card>
        <Text style={styles.muted}>
          {provider?.name ?? 'Bill'}
          {account.reference ? ` · Ref ${account.reference}` : ''}
        </Text>
        {latest ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text style={styles.amount}>{formatRs(latest.amountDue)}</Text>
              <StatusPill status={dueStatus(latest.dueDate, latest.paid)} label={dueText(latest.dueDate, latest.paid)} />
            </View>
            <Text style={styles.body}>
              {formatMonth(latest.month)} bill · due {formatDate(latest.dueDate)}
            </Text>
            {latest.summary && <Text style={styles.body}>💡 {latest.summary}</Text>}
            <Row label="After due date" value={formatRs(latest.amountAfterDueDate)} />
            <Row
              label="Units used"
              value={latest.unitsUsed != null ? `${latest.unitsUsed} ${latest.unitsLabel ?? ''}`.trim() : '—'}
            />
            <Row label="Read from" value={latest.source === 'auto' ? 'Company website' : 'Your photo'} />
            <Button
              title={latest.paid ? 'Mark as not paid' : '✓ Mark as paid'}
              variant={latest.paid ? 'secondary' : 'primary'}
              onPress={() => setPaid(account.id, latest.month, !latest.paid)}
            />
          </>
        ) : (
          <Text style={styles.body}>{isChecking ? 'Checking for your bill…' : 'No bill saved yet.'}</Text>
        )}
        {account.lastError && !isChecking && <Text style={styles.error}>⚠️ {account.lastError}</Text>}
        {account.lastCheckedAt && (
          <Text style={styles.muted}>Last checked {new Date(account.lastCheckedAt).toLocaleString()}</Text>
        )}
      </Card>

      {provider && canAutoFetch(provider) && (
        <Button title="Check now" variant="secondary" loading={isChecking} onPress={() => refreshAccount(account.id)} />
      )}
      <Button
        title="📷 Scan this bill"
        variant="secondary"
        onPress={() => router.push({ pathname: '/scan', params: { accountId: account.id } })}
      />

      {older.length > 0 && (
        <Card>
          <Text style={styles.h2}>Past bills</Text>
          {older.map((b) => (
            <View key={b.month} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
              <Text style={[styles.body, { flex: 1 }]}>{formatMonth(b.month)}</Text>
              <Text style={[styles.body, { fontWeight: '600' }]}>{formatRs(b.amountDue)}</Text>
              <Button
                title={b.paid ? 'Paid ✓' : 'Unpaid'}
                variant="secondary"
                onPress={() => setPaid(account.id, b.month, !b.paid)}
              />
            </View>
          ))}
        </Card>
      )}

      <Button
        title="Delete this bill"
        variant="danger"
        onPress={() =>
          confirm('Delete this bill?', `“${account.nickname}” and its history will be removed from this phone.`, () => {
            removeAccount(account.id);
            router.replace('/');
          })
        }
      />
    </ScrollView>
  );
}

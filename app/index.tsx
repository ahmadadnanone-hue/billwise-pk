// Home screen: every bill in one place.

import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, StatusPill, styles } from '@/components/ui';
import { useAccounts } from '@/lib/AccountsContext';
import { dueStatus, dueText, formatMonth, formatRs } from '@/lib/dates';
import { canAutoFetch, getProvider } from '@/shared/providers';

export default function Home() {
  const { accounts, loading, checking, refreshAll } = useAccounts();

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unpaid = accounts
    .map((a) => a.bills[0])
    .filter((b) => b && !b.paid && b.amountDue != null);
  const totalUnpaid = unpaid.reduce((sum, b) => sum + (b!.amountDue ?? 0), 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={checking.length > 0} onRefresh={refreshAll} />}
    >
      <Card>
        <Text style={styles.muted}>Still to pay</Text>
        <Text style={styles.amount}>{formatRs(totalUnpaid)}</Text>
        <Text style={styles.muted}>
          {unpaid.length === 0 ? 'Nothing waiting. 🎉' : `${unpaid.length} bill${unpaid.length === 1 ? '' : 's'} unpaid`}
        </Text>
      </Card>

      <Button title="+ Add a bill" onPress={() => router.push('/add')} />

      {accounts.length === 0 && (
        <Card>
          <Text style={styles.h2}>Add your bills once</Text>
          <Text style={styles.body}>
            Tap <Text style={{ fontWeight: '700' }}>Add a bill</Text> and enter the reference number from your
            electricity bill (LESCO, FESCO, IESCO…). BillWise checks it for you every time you open the app.
          </Text>
          <Text style={styles.body}>
            Other bills (gas, PTCL, K-Electric, school fees…) can be added too: you type in the amount and due date
            each month.
          </Text>
        </Card>
      )}

      {accounts.map((account) => {
        const provider = getProvider(account.providerId);
        const latest = account.bills[0];
        const isChecking = checking.includes(account.id);
        return (
          <Link key={account.id} href={{ pathname: '/account/[id]', params: { id: account.id } }} asChild>
            <Pressable>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h2}>{account.nickname}</Text>
                    <Text style={styles.muted}>
                      {provider?.name ?? 'Bill'}
                      {account.reference ? ` · ${account.reference}` : ''}
                    </Text>
                  </View>
                  {isChecking ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : latest ? (
                    <StatusPill status={dueStatus(latest.dueDate, latest.paid)} label={dueText(latest.dueDate, latest.paid)} />
                  ) : null}
                </View>

                {latest ? (
                  <Text style={styles.body}>
                    <Text style={{ fontWeight: '700' }}>{formatRs(latest.amountDue)}</Text> for {formatMonth(latest.month)}
                  </Text>
                ) : (
                  <Text style={styles.muted}>
                    {isChecking
                      ? 'Checking for your bill…'
                      : provider && canAutoFetch(provider)
                        ? 'No bill yet. Pull down to check again.'
                        : 'No bill yet. Tap to enter this month’s bill.'}
                  </Text>
                )}
                {account.lastError && !isChecking ? <Text style={styles.error}>⚠️ {account.lastError}</Text> : null}
              </Card>
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

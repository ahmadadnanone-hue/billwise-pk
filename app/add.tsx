// "Add a bill" screen: pick the company, type the reference number once.

import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Card, colors, styles } from '@/components/ui';
import { useAccounts } from '@/lib/AccountsContext';
import { canAutoFetch, checkReference, cleanReference, getProvider, PROVIDERS } from '@/shared/providers';

export default function AddBill() {
  const { addAccount } = useAccounts();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const provider = providerId ? getProvider(providerId) : undefined;
  const auto = PROVIDERS.filter(canAutoFetch);
  const manualOnly = PROVIDERS.filter((p) => !canAutoFetch(p));

  const save = () => {
    if (!provider) return setError('Please choose the company first.');
    const ref = cleanReference(reference);
    const problem = checkReference(provider, ref);
    if (problem) return setError(problem);
    const account = addAccount({ providerId: provider.id, reference: ref, nickname: nickname.trim() });
    router.replace({ pathname: '/account/[id]', params: { id: account.id } });
  };

  const choice = (id: string, name: string) => (
    <Pressable
      key={id}
      onPress={() => {
        setProviderId(id);
        setError(null);
      }}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: providerId === id ? colors.primary : colors.border,
        backgroundColor: providerId === id ? colors.okBg : colors.card,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: providerId === id ? '700' : '400' }}>{name}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>1. Which company sends this bill?</Text>
        <Text style={styles.muted}>Checked automatically:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{auto.map((p) => choice(p.id, p.name))}</View>
        <Text style={styles.muted}>You type in the amount each month:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{manualOnly.map((p) => choice(p.id, p.name))}</View>

        {provider && (
          <>
            <Text style={styles.label}>2. Reference number</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={(t) => {
                setReference(t);
                setError(null);
              }}
              placeholder={provider.referenceDigits ? '0'.repeat(provider.referenceDigits) : 'Reference number (optional)'}
              placeholderTextColor={colors.muted}
              keyboardType={provider.referenceDigits ? 'number-pad' : 'default'}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.muted}>{provider.referenceHint}</Text>

            <Text style={styles.label}>3. Name it (optional)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Home electricity, Shop gas"
              placeholderTextColor={colors.muted}
            />

            {!canAutoFetch(provider) && (
              <Card style={{ backgroundColor: colors.warnBg, borderColor: colors.warnBg }}>
                <Text style={styles.body}>
                  We can't check {provider.name} online yet. After saving, tap “Enter a bill by hand” each month to add
                  the amount and due date.
                </Text>
              </Card>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Save" onPress={save} disabled={!provider} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

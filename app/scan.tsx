// "Scan a bill" screen: take/choose a photo → AI reads it → check → save.

import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, ScrollView, Text, View } from 'react-native';
import { Button, Card, Row, styles } from '@/components/ui';
import { useAccounts } from '@/lib/AccountsContext';
import { readBill } from '@/lib/api';
import { formatDate, formatMonth, formatRs } from '@/lib/dates';
import type { BillReading } from '@/shared/bill-reading';
import { getProvider } from '@/shared/providers';

type Photo = { uri: string; base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' };

export default function Scan() {
  // When opened from a bill's page, the scan is saved to that bill.
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const { accounts, saveScan } = useAccounts();
  const target = accounts.find((a) => a.id === accountId);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [reading, setReading] = useState<BillReading | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (from: 'camera' | 'library') => {
    setError(null);
    setReading(null);
    if (from === 'camera' && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera permission needed', 'Please allow camera access in Settings, or choose a photo instead.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6, // smaller file = faster upload, still sharp enough to read
    };
    const result =
      from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return setError('Could not read that photo. Please try another one.');
    const mediaType =
      asset.mimeType === 'image/png' || asset.mimeType === 'image/webp' ? asset.mimeType : 'image/jpeg';
    const next = { uri: asset.uri, base64: asset.base64, mediaType } as Photo;
    setPhoto(next);
    await read(next);
  };

  const read = async (p: Photo) => {
    setBusy(true);
    setError(null);
    try {
      const r = await readBill({ kind: 'image', mediaType: p.mediaType, data: p.base64 });
      if (!r.found) setError(r.problem ?? 'We could not find a bill in this photo.');
      else setReading(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const providerId = target?.providerId ?? (reading?.provider_id && getProvider(reading.provider_id) ? reading.provider_id : 'other');

  const save = () => {
    if (!reading) return;
    try {
      const id = saveScan(reading, providerId, target?.id);
      router.replace({ pathname: '/account/[id]', params: { id } });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {target && <Text style={styles.muted}>Adding a bill to “{target.nickname}”.</Text>}
      <Text style={styles.body}>
        Take a clear photo of the whole bill, flat and in good light. AI will read the amount, due date and units.
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="📷 Take photo" onPress={() => pick('camera')} disabled={busy} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="🖼️ Choose photo" variant="secondary" onPress={() => pick('library')} disabled={busy} />
        </View>
      </View>

      {photo && (
        <Image
          source={{ uri: photo.uri }}
          style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: '#ddd' }}
          resizeMode="contain"
        />
      )}

      {busy && (
        <Card>
          <Button title="Reading your bill…" onPress={() => {}} loading />
          <Text style={styles.muted}>This usually takes 5–15 seconds.</Text>
        </Card>
      )}

      {error && (
        <Card>
          <Text style={styles.error}>⚠️ {error}</Text>
          {photo && !busy && <Button title="Try again" variant="secondary" onPress={() => read(photo)} />}
        </Card>
      )}

      {reading && (
        <Card>
          <Text style={styles.h2}>{reading.company ?? 'Bill'}</Text>
          {reading.summary && <Text style={styles.body}>💡 {reading.summary}</Text>}
          <Row label="Amount due" value={formatRs(reading.amount_due)} />
          <Row label="After due date" value={formatRs(reading.amount_after_due_date)} />
          <Row label="Due date" value={formatDate(reading.due_date)} />
          <Row label="Bill month" value={reading.bill_month ? formatMonth(reading.bill_month) : '—'} />
          <Row
            label="Units used"
            value={reading.units_used != null ? `${reading.units_used} ${reading.units_label ?? ''}`.trim() : '—'}
          />
          <Row label="Reference no." value={reading.reference_number ?? '—'} />
          {reading.customer_name && <Row label="Name on bill" value={reading.customer_name} />}
          <Text style={styles.muted}>Please check these numbers against the bill before saving.</Text>
          <Button title="Looks right. Save" onPress={save} />
        </Card>
      )}
    </ScrollView>
  );
}

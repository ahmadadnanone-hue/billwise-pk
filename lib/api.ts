// Talks to our server function (api/read-bill.ts on Vercel).

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { BillReading, ReadBillRequest, ReadBillResponse } from '@/shared/bill-reading';

/** Where the server lives. */
function apiBase(): string {
  // 1. An address set while building the app wins (EXPO_PUBLIC_API_URL in a .env file).
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // 2. The deployed website talks to its own server, so the address is the same site.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !/^(localhost|127\.)/.test(window.location.hostname)) {
    return '';
  }
  // 3. Otherwise use the address from app.json ("extra" → "apiUrl").
  const fromConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  return (fromConfig ?? '').replace(/\/$/, '');
}

export async function readBill(request: ReadBillRequest): Promise<BillReading> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const appKey = process.env.EXPO_PUBLIC_BILLWISE_APP_KEY;
  if (appKey) headers['x-billwise-key'] = appKey;

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/api/read-bill`, { method: 'POST', headers, body: JSON.stringify(request) });
  } catch {
    throw new Error('No internet connection, or the BillWise server is unreachable.');
  }

  let body: ReadBillResponse;
  try {
    body = await res.json();
  } catch {
    throw new Error(`The BillWise server sent an unexpected reply (error ${res.status}).`);
  }
  if (!body.ok) throw new Error(body.error);
  return body.reading;
}

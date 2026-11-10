// Saves the user's accounts on the phone (AsyncStorage = a small storage box inside the app).

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Account } from './types';

const KEY = 'billwise.v2.accounts';

export async function loadAccounts(): Promise<Account[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.accounts) ? data.accounts : [];
  } catch (err) {
    console.warn('Could not load saved bills', err);
    return [];
  }
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ accounts, savedAt: new Date().toISOString() }));
  } catch (err) {
    console.warn('Could not save bills', err);
  }
}

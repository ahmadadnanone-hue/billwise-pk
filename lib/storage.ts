import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bill } from './types';
import { BILL_TYPES } from './config';

const STORAGE_KEY = 'utility-bills-data';

export function defaultBills(): Bill[] {
  return BILL_TYPES.map(t => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    color: t.color,
    unit: t.unit,
    dueDay: t.dueDay,
    amount: 0,
    lastAmount: 0,
    usage: 0,
    lastUsage: 0,
    paidThisMonth: false,
    notes: '',
    reminder: true,
    history: [],
  }));
}

export async function loadBills(): Promise<Bill[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data?.bills || defaultBills();
    }
    return defaultBills();
  } catch {
    return defaultBills();
  }
}

export async function saveBills(bills: Bill[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ bills, savedAt: new Date().toISOString() })
    );
  } catch {}
}

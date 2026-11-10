// Gets the latest bill for an account from the company website, and saves bills.

import { Platform } from 'react-native';
import { fetchPitcBill } from '@/shared/pitc';
import { getProvider } from '@/shared/providers';
import type { Account, BillRecord } from './types';

/**
 * Automatic fetch for the government electricity companies (bill.pitc.com.pk).
 * The steps are in shared/pitc.ts.
 *
 * This runs ON THE PHONE: the site only accepts visitors from Pakistan, and
 * web browsers don't allow one website to read another's pages.
 */
export async function fetchLatestBill(account: Account): Promise<BillRecord> {
  const provider = getProvider(account.providerId);
  if (!provider?.pitcCode) throw new Error('This company can’t be checked online. Enter the bill by hand.');
  if (Platform.OS === 'web') {
    throw new Error('Automatic checking works in the phone app only. On the website, enter the bill by hand.');
  }

  const bill = await fetchPitcBill(provider.pitcCode, account.reference);
  return {
    month: bill.billMonth ?? bill.dueDate?.slice(0, 7) ?? new Date().toISOString().slice(0, 7),
    amountDue: bill.amountDue,
    amountAfterDueDate: bill.amountAfterDueDate,
    dueDate: bill.dueDate,
    unitsUsed: bill.unitsUsed,
    source: 'auto',
    savedAt: new Date().toISOString(),
    paid: false,
  };
}

/** Adds or replaces the bill for that month, keeping the "paid" tick if it was already set. */
export function mergeBill(bills: BillRecord[], record: BillRecord): BillRecord[] {
  const existing = bills.find((b) => b.month === record.month);
  const merged = existing ? { ...record, paid: existing.paid } : record;
  return [merged, ...bills.filter((b) => b.month !== record.month)].sort((a, b) => b.month.localeCompare(a.month));
}

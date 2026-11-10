// Gets the latest bill for an account, and turns AI readings into saved bill records.

import { Platform } from 'react-native';
import type { BillReading } from '@/shared/bill-reading';
import { getProvider } from '@/shared/providers';
import { htmlToText } from '@/shared/html';
import { readBill } from './api';
import { currentMonth, isDate, isMonth } from './dates';
import type { Account, BillRecord } from './types';

/**
 * Option A — automatic fetch.
 *
 * On a phone we open the company's bill page FROM THE PHONE. The phone is in
 * Pakistan, and these sites block visitors from abroad (our server is abroad).
 * Then we send just the page's text to our server, where the AI reads it.
 *
 * On the website version, browsers don't allow one site to read another
 * site's page, so we ask the server to open the page itself (may be blocked).
 */
export async function fetchLatestBill(account: Account): Promise<BillReading> {
  const provider = getProvider(account.providerId);
  if (!provider?.billPageUrl) {
    throw new Error('This company has no online bill page we can read. Use "Scan a bill" instead.');
  }

  if (Platform.OS !== 'web') {
    let pageText: string | null = null;
    try {
      const res = await fetch(provider.billPageUrl(account.reference));
      if (res.ok) pageText = htmlToText(await res.text());
    } catch {
      // Fall through to the server below.
    }
    if (pageText && pageText.length > 50) {
      return readBill({ kind: 'page', providerId: provider.id, reference: account.reference, pageText });
    }
  }
  return readBill({ kind: 'reference', providerId: provider.id, reference: account.reference });
}

/** Turns what the AI read into a bill record we can save. Returns null if no bill was found. */
export function toBillRecord(reading: BillReading, source: BillRecord['source']): BillRecord | null {
  if (!reading.found) return null;
  const dueDate = isDate(reading.due_date) ? reading.due_date : null;
  const month = isMonth(reading.bill_month) ? reading.bill_month : dueDate ? dueDate.slice(0, 7) : currentMonth();
  return {
    month,
    amountDue: reading.amount_due,
    amountAfterDueDate: reading.amount_after_due_date,
    dueDate,
    unitsUsed: reading.units_used,
    unitsLabel: reading.units_label,
    summary: reading.summary,
    source,
    readAt: new Date().toISOString(),
    paid: false,
  };
}

/** Adds or replaces the bill for that month, keeping the "paid" tick if it was already set. */
export function mergeBill(bills: BillRecord[], record: BillRecord): BillRecord[] {
  const existing = bills.find((b) => b.month === record.month);
  const merged = existing ? { ...record, paid: existing.paid } : record;
  return [merged, ...bills.filter((b) => b.month !== record.month)].sort((a, b) => b.month.localeCompare(a.month));
}

/** Digits/letters only, for comparing reference numbers typed in different ways. */
export const sameReference = (a: string, b: string) =>
  a.replace(/[^0-9A-Z]/gi, '').toUpperCase() === b.replace(/[^0-9A-Z]/gi, '').toUpperCase();

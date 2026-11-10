// Small helpers for dates and money.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const isMonth = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** "2026-11" for today. */
export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Whole days from today until the date. 0 = today, negative = overdue.
 * Compares calendar dates only (ignores the clock), so "due today" really shows as today.
 */
export function daysUntil(isoDate: string, now = new Date()): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const due = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86_400_000);
}

export type DueStatus = 'paid' | 'overdue' | 'today' | 'soon' | 'upcoming' | 'unknown';

export function dueStatus(dueDate: string | null, paid: boolean): DueStatus {
  if (paid) return 'paid';
  if (!dueDate || !isDate(dueDate)) return 'unknown';
  const days = daysUntil(dueDate);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  return 'upcoming';
}

export function dueText(dueDate: string | null, paid: boolean): string {
  if (paid) return 'Paid';
  if (!dueDate || !isDate(dueDate)) return 'Due date unknown';
  const days = daysUntil(dueDate);
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
}

/** "2026-10" → "Oct 2026" */
export function formatMonth(month: string): string {
  if (!isMonth(month)) return month;
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2026-10-25" → "25 Oct 2026" */
export function formatDate(date: string | null): string {
  if (!date || !isDate(date)) return '—';
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** 45200 → "Rs. 45,200" */
export function formatRs(amount: number | null | undefined): string {
  if (amount == null || !isFinite(amount)) return '—';
  return `Rs. ${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

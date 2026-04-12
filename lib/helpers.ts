import { Bill } from './types';

export function getDaysUntilDue(dueDay: number): number {
  const now = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type BillStatus = 'paid' | 'urgent' | 'due-soon' | 'upcoming';

export function getStatus(bill: Bill): BillStatus {
  if (bill.paidThisMonth) return 'paid';
  const days = getDaysUntilDue(bill.dueDay);
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'due-soon';
  return 'upcoming';
}

export const STATUS_STYLES: Record<BillStatus, { label: string; bg: string; text: string }> = {
  paid: { label: 'Paid', bg: '#064E3B', text: '#6EE7B7' },
  urgent: { label: 'URGENT', bg: '#7F1D1D', text: '#FCA5A5' },
  'due-soon': { label: 'Due Soon', bg: '#78350F', text: '#FCD34D' },
  upcoming: { label: 'Upcoming', bg: '#1E3A5F', text: '#93C5FD' },
};

/** One month's bill for one account. */
export interface BillRecord {
  /** "YYYY-MM" — one record per month, so "paid" naturally resets each new month. */
  month: string;
  amountDue: number | null;
  amountAfterDueDate: number | null;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  unitsUsed: number | null;
  /** 'auto' = read from the company website, 'manual' = typed in by the user. */
  source: 'auto' | 'manual';
  /** When we saved this bill (ISO date-time). */
  savedAt: string;
  paid: boolean;
}

/** A bill the user follows, e.g. "Home electricity" with its reference number. */
export interface Account {
  id: string;
  providerId: string;
  reference: string;
  nickname: string;
  createdAt: string;
  lastCheckedAt: string | null;
  lastError: string | null;
  /** Newest month first. */
  bills: BillRecord[];
}

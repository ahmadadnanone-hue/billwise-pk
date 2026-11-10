/** One month's bill for one account. */
export interface BillRecord {
  /** "YYYY-MM" — one record per month, so "paid" naturally resets each new month. */
  month: string;
  amountDue: number | null;
  amountAfterDueDate: number | null;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  unitsUsed: number | null;
  unitsLabel: string | null;
  /** Short explanation written by the AI. */
  summary: string | null;
  /** 'auto' = fetched from the company website, 'scan' = read from a photo. */
  source: 'auto' | 'scan';
  /** When we read this bill (ISO date-time). */
  readAt: string;
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

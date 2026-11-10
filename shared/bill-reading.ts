// The "shape" of what the AI sends back after reading a bill.
// Shared by the server (which asks the AI) and the app (which shows the result).

import { z } from 'zod';

export const BillReadingSchema = z.object({
  /** false when the image/page does not contain a readable bill. */
  found: z.boolean(),
  /** When found is false: a short, friendly reason (e.g. "The photo is blurry"). */
  problem: z.string().nullable(),
  /** Company that issued the bill, e.g. "LESCO". */
  company: z.string().nullable(),
  /** Our provider id if the AI recognises it (lesco, sngpl, ptcl, ...), else "other". */
  provider_id: z.string().nullable(),
  reference_number: z.string().nullable(),
  customer_name: z.string().nullable(),
  /** Month the bill is for, as "YYYY-MM". */
  bill_month: z.string().nullable(),
  /** Rupees payable on or before the due date. */
  amount_due: z.number().nullable(),
  /** Rupees payable after the due date (includes late surcharge). */
  amount_after_due_date: z.number().nullable(),
  /** "YYYY-MM-DD" */
  due_date: z.string().nullable(),
  /** Units used this month (kWh for electricity, hm³ for gas, etc). */
  units_used: z.number().nullable(),
  units_label: z.string().nullable(),
  /** 1–2 plain-English sentences: what this bill is and anything worth noticing. */
  summary: z.string().nullable(),
});

export type BillReading = z.infer<typeof BillReadingSchema>;

/** What the app sends to the server. */
export type ReadBillRequest =
  | { kind: 'image'; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string }
  | { kind: 'page'; providerId: string; reference: string; pageText: string }
  | { kind: 'reference'; providerId: string; reference: string };

export type ReadBillResponse = { ok: true; reading: BillReading } | { ok: false; error: string };

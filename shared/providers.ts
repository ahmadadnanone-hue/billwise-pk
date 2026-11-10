// The list of bill companies the app knows about.

export type BillKind = 'electricity' | 'gas' | 'water' | 'internet' | 'phone' | 'education' | 'other';

export interface Provider {
  id: string;
  name: string;
  kind: BillKind;
  /** Short help text shown under the reference-number box. */
  referenceHint: string;
  /** How many digits the reference number has, when we know it. */
  referenceDigits?: number;
  /**
   * The company's section on bill.pitc.com.pk (e.g. "lesco" → /lescobill).
   * Only these bills can be checked automatically; the rest are entered by hand.
   */
  pitcCode?: string;
}

const PITC_HINT = '14-digit reference number near the top of your bill, e.g. 04 15172 2337322 U';

const pitc = (code: string, city: string): Provider => ({
  id: code,
  name: `${code.toUpperCase()} (${city})`,
  kind: 'electricity',
  referenceHint: PITC_HINT,
  referenceDigits: 14,
  pitcCode: code,
});

export const PROVIDERS: Provider[] = [
  pitc('lesco', 'Lahore'),
  pitc('gepco', 'Gujranwala'),
  pitc('fesco', 'Faisalabad'),
  pitc('iesco', 'Islamabad'),
  pitc('mepco', 'Multan'),
  pitc('pesco', 'Peshawar'),
  pitc('hesco', 'Hyderabad'),
  pitc('sepco', 'Sukkur'),
  pitc('qesco', 'Quetta'),
  pitc('tesco', 'Tribal areas'),
  // Entered by hand for now:
  { id: 'ke', name: 'K-Electric (Karachi)', kind: 'electricity', referenceHint: 'Account number from your bill' },
  { id: 'sngpl', name: 'SNGPL Gas (Punjab, KP)', kind: 'gas', referenceHint: 'Consumer number from your gas bill' },
  { id: 'ssgc', name: 'SSGC Gas (Sindh, Balochistan)', kind: 'gas', referenceHint: 'Consumer number from your bill' },
  { id: 'ptcl', name: 'PTCL / Internet', kind: 'internet', referenceHint: 'Account ID or phone number' },
  { id: 'wasa', name: 'Water (WASA)', kind: 'water', referenceHint: 'Consumer number from your bill' },
  { id: 'mobile', name: 'Mobile (postpaid)', kind: 'phone', referenceHint: 'Your mobile number' },
  { id: 'school', name: 'School fees', kind: 'education', referenceHint: 'Student ID or challan number' },
  { id: 'other', name: 'Other bill', kind: 'other', referenceHint: 'Any number that identifies this bill' },
];

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Removes spaces and dashes people type, e.g. "04 15172 2337322 u" → "04151722337322U". */
export function cleanReference(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/** Returns an error message if the reference number looks wrong, or null if it's fine. */
export function checkReference(provider: Provider, reference: string): string | null {
  if (!reference) return provider.pitcCode ? 'Please enter the reference number.' : null;
  if (reference.length > 40) return 'That number is too long.';
  if (provider.referenceDigits) {
    const digits = reference.replace(/\D/g, '');
    if (digits.length !== provider.referenceDigits) {
      return `${provider.name} numbers have ${provider.referenceDigits} digits. You entered ${digits.length}.`;
    }
  }
  return null;
}

export const canAutoFetch = (p: Provider) => Boolean(p.pitcCode);

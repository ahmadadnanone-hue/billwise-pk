// The list of bill companies the app knows about.
// This file is shared by the app (on the phone) and the server (api/ folder).

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
   * Web page that shows the bill for a reference number.
   * When missing, the app can't fetch this bill automatically and the
   * user scans a photo of the paper bill instead.
   */
  billPageUrl?: (reference: string) => string;
}

// The ten government electricity companies all publish bills on the same
// PITC website, one section per company (e.g. /lescobill, /fescobill).
const pitc = (code: string) => (reference: string) =>
  // Bills print an extra letter after the digits (e.g. "...U"); the site only wants the 14 digits.
  `https://bill.pitc.com.pk/${code}bill/general?refno=${reference.replace(/\D/g, '')}`;

const PITC_HINT = '14-digit reference number, printed near the top of your bill';

export const PROVIDERS: Provider[] = [
  { id: 'lesco', name: 'LESCO (Lahore)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('lesco') },
  { id: 'gepco', name: 'GEPCO (Gujranwala)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('gepco') },
  { id: 'fesco', name: 'FESCO (Faisalabad)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('fesco') },
  { id: 'iesco', name: 'IESCO (Islamabad)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('iesco') },
  { id: 'mepco', name: 'MEPCO (Multan)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('mepco') },
  { id: 'pesco', name: 'PESCO (Peshawar)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('pesco') },
  { id: 'hesco', name: 'HESCO (Hyderabad)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('hesco') },
  { id: 'sepco', name: 'SEPCO (Sukkur)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('sepco') },
  { id: 'qesco', name: 'QESCO (Quetta)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('qesco') },
  { id: 'tesco', name: 'TESCO (Tribal areas)', kind: 'electricity', referenceHint: PITC_HINT, referenceDigits: 14, billPageUrl: pitc('tesco') },
  {
    id: 'sngpl',
    name: 'SNGPL Gas (Punjab, KP)',
    kind: 'gas',
    referenceHint: '11-digit consumer number from your gas bill (auto-fetch is experimental)',
    referenceDigits: 11,
    billPageUrl: (ref) =>
      `https://www.sngpl.com.pk/viewbill?proc=viewbill&contype=NewCon&mobile=n&consumer=${encodeURIComponent(ref)}`,
  },
  // No public bill page we can use yet: these work through "Scan a bill".
  { id: 'ke', name: 'K-Electric (Karachi)', kind: 'electricity', referenceHint: 'Account number from your bill' },
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

/** Removes spaces and dashes people type, e.g. "04 11111 1234567 U" → "04111111234567U". */
export function cleanReference(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/** Returns an error message if the reference number looks wrong, or null if it's fine. */
export function checkReference(provider: Provider, reference: string): string | null {
  if (!reference) return 'Please enter the reference number.';
  if (reference.length > 40) return 'That number is too long.';
  if (provider.referenceDigits) {
    const digits = reference.replace(/\D/g, '');
    if (digits.length !== provider.referenceDigits) {
      return `${provider.name} numbers have ${provider.referenceDigits} digits. You entered ${digits.length}.`;
    }
  }
  return null;
}

export const canAutoFetch = (p: Provider) => typeof p.billPageUrl === 'function';

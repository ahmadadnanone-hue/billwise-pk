// Reads the bill pages of the government electricity companies (bill.pitc.com.pk).
// Plain code, no AI: we find each label on the page (e.g. "DUE DATE") and read
// the value next to it or under it.
//
// The page is laid out with tables in two ways:
//   1. label row, value row underneath:   | BILL MONTH | ISSUE DATE | DUE DATE |
//                                          | OCT 26     | 22 OCT 26  | 03 NOV 26|
//   2. label cell, value to its right:    | PAYABLE WITHIN DUE DATE | 16579 |

export interface PitcBill {
  /** "YYYY-MM" */
  billMonth: string | null;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  amountDue: number | null;
  amountAfterDueDate: number | null;
  unitsUsed: number | null;
}

type Table = string[][]; // rows → cells (plain text)

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

/** Splits a page into its tables, rows and cells. Tables inside tables are kept separate. */
export function readTables(html: string): Table[] {
  const tables: Table[] = [];
  const open: Table[] = []; // tables we are currently inside
  let cell: string[] | null = null;
  const cellStack: (string[] | null)[] = [];

  const tag = /<(\/?)(table|tr|td|th)\b[^>]*>|<br\s*\/?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;

  const addText = (raw: string) => {
    if (cell) cell.push(raw);
  };

  while ((m = tag.exec(html))) {
    addText(html.slice(last, m.index));
    last = tag.lastIndex;
    if (!m[2]) {
      addText(' '); // <br>
      continue;
    }
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const table = open[open.length - 1];

    if (name === 'table') {
      if (!closing) {
        cellStack.push(cell); // remember the outer cell while we read the inner table
        cell = null;
        const t: Table = [];
        open.push(t);
        tables.push(t);
      } else if (open.length) {
        open.pop();
        cell = cellStack.pop() ?? null;
      }
    } else if (name === 'tr' && !closing && table) {
      table.push([]);
    } else if ((name === 'td' || name === 'th') && table) {
      if (!closing) {
        if (!table.length) table.push([]);
        cell = [];
        table[table.length - 1].push(''); // placeholder, filled on close
      } else if (cell) {
        const row = table[table.length - 1];
        row[row.length - 1] = clean(cell.join(''));
        cell = null;
      }
    }
  }
  return tables;
}

function clean(htmlText: string): string {
  return htmlText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the value for a label: first the cell to its right, then the cell under it.
 * `accept` decides whether a candidate value looks right (e.g. is a date).
 */
function findValue<T>(tables: Table[], label: string, accept: (s: string) => T | null): T | null {
  const wanted = label.toUpperCase();
  for (const t of tables) {
    for (let r = 0; r < t.length; r++) {
      for (let c = 0; c < t[r].length; c++) {
        if (t[r][c].toUpperCase() !== wanted) continue;
        const right = t[r][c + 1];
        const below = t[r + 1]?.[c];
        for (const candidate of [right, below]) {
          if (candidate == null) continue;
          const value = accept(candidate);
          if (value != null) return value;
        }
      }
    }
  }
  return null;
}

/** "16,579" or "16579 " → 16579 (first number in the cell). */
export function parseAmount(s: string): number | null {
  const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/**
 * The late amount is printed in steps, e.g. "Till 28-MAR-25 17202 After 28-MAR-25 17825".
 * We take the first step (the amount if paid a few days late).
 */
export function parseLateAmount(s: string): number | null {
  const m = s.replace(/,/g, '').match(/TILL\s+\S+\s+(\d+(\.\d+)?)/i);
  if (m) return Number(m[1]);
  return /[A-Z]{3}/i.test(s) ? null : parseAmount(s); // a plain number with no dates in the cell
}

/** "03 NOV 26" / "03-Nov-2026" → "2026-11-03" */
export function parseDate(s: string): string | null {
  const m = s.toUpperCase().match(/\b(\d{1,2})[\s-]+([A-Z]{3})[A-Z]*[\s-]+(\d{2}|\d{4})\b/);
  if (!m || !MONTHS[m[2]]) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return `${year}-${String(MONTHS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** "OCT 26" / "OCT-2026" → "2026-10" */
export function parseMonth(s: string): string | null {
  const m = s.toUpperCase().match(/^([A-Z]{3})[A-Z]*[\s-]+(\d{2}|\d{4})$/);
  if (!m || !MONTHS[m[1]]) return null;
  const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  return `${year}-${String(MONTHS[m[1]]).padStart(2, '0')}`;
}

/** Returns the bill, or null if the page doesn't contain one (e.g. wrong reference number). */
export function parsePitcBill(html: string): PitcBill | null {
  const tables = readTables(html);
  const bill: PitcBill = {
    billMonth: findValue(tables, 'BILL MONTH', parseMonth),
    dueDate: findValue(tables, 'DUE DATE', parseDate),
    amountDue: findValue(tables, 'PAYABLE WITHIN DUE DATE', parseAmount),
    amountAfterDueDate: findValue(tables, 'PAYABLE AFTER DUE DATE', parseLateAmount),
    unitsUsed: findValue(tables, 'UNITS CONSUMED', parseAmount),
  };
  // Without an amount and a due date it isn't a usable bill.
  return bill.amountDue != null || bill.dueDate != null ? bill : null;
}

/**
 * Looks up a bill on bill.pitc.com.pk the way a person would:
 *   1. open the company's bill page, which hands out hidden security codes,
 *   2. send the search form back with those codes and the reference number,
 *   3. read the bill page that comes back.
 * Throws an Error with a friendly message if anything goes wrong.
 */
export async function fetchPitcBill(
  pitcCode: string,
  reference: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PitcBill> {
  const url = `https://bill.pitc.com.pk/${pitcCode}bill`;
  const digits = reference.replace(/\D/g, '');
  const letter = reference.replace(/[^A-Z]/gi, '').toUpperCase(); // "U" (urban) or "R" (rural), if printed

  let page: string;
  try {
    const first = await fetchImpl(url);
    const form: Record<string, string> = {
      ...readFormFields(await first.text()),
      rbSearchByList: 'refno',
      searchTextBox: digits,
      ruCodeTextBox: letter,
      btnSearch: 'Search',
    };
    const body = Object.entries(form)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', referer: url },
      body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    page = await res.text();
  } catch {
    throw new Error('Could not reach the bill website. Check your internet and try again.');
  }

  const bill = parsePitcBill(page);
  if (!bill) {
    throw new Error(readSiteError(page) ?? 'No bill found for this reference number. Please check the number.');
  }
  return bill;
}

/** Hidden security codes the site puts in its search form; they must be sent back with the search. */
export function readFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const input = /<input\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = input.exec(html))) {
    const tagText = m[0];
    const type = /\btype="([^"]*)"/i.exec(tagText)?.[1]?.toLowerCase();
    const name = /\bname="([^"]*)"/i.exec(tagText)?.[1];
    if (!name || type !== 'hidden') continue;
    fields[name] = decodeEntities(/\bvalue="([^"]*)"/i.exec(tagText)?.[1] ?? '');
  }
  return fields;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** The site's own error message for a wrong number (shown in a box with id="ua"), if any. */
export function readSiteError(html: string): string | null {
  const m = /<[^>]+id="ua"[^>]*>([\s\S]*?)<\/(div|span|p)>/i.exec(html);
  const text = m ? clean(m[1]) : '';
  return text || null;
}

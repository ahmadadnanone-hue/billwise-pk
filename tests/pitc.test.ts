// Checks that we read electricity bills correctly. Run with: npm test
//
// The sample page (tests/fixtures/pitc-bill.html) copies the table layout of real
// bill.pitc.com.pk pages, with made-up values. The reader was also checked by hand
// against real saved MEPCO and HESCO bill pages, which use this same layout.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  fetchPitcBill,
  parseDate,
  parseLateAmount,
  parseMonth,
  parsePitcBill,
  readFormFields,
  readSiteError,
} from '../shared/pitc';

// Path is from the project folder, where `npm test` runs.
const samplePage: string = readFileSync('tests/fixtures/pitc-bill.html', 'utf8');

test('reads all the bill details from a bill page', () => {
  assert.deepEqual(parsePitcBill(samplePage), {
    billMonth: '2026-10',
    dueDate: '2026-11-03',
    amountDue: 12345,
    amountAfterDueDate: 12845,
    unitsUsed: 215,
  });
});

test('a page without a bill gives null', () => {
  assert.equal(parsePitcBill('<html><body><div id="ua">Invalid Reference Number</div></body></html>'), null);
});

test('reads the website’s error message', () => {
  assert.equal(readSiteError('<div id="ua"> Invalid Reference Number </div>'), 'Invalid Reference Number');
  assert.equal(readSiteError('<div id="ua"></div>'), null);
});

test('understands the date formats printed on bills', () => {
  assert.equal(parseDate('03 NOV 26'), '2026-11-03');
  assert.equal(parseDate('3-Nov-2026'), '2026-11-03');
  assert.equal(parseDate('1.5%'), null);
  assert.equal(parseMonth('OCT 26'), '2026-10');
  assert.equal(parseMonth('03 NOV 26'), null);
  assert.equal(parseLateAmount('Till 28-MAR-25 17,202 After 28-MAR-25 17825'), 17202);
  assert.equal(parseLateAmount('17825'), 17825);
});

test('reads the hidden form codes', () => {
  const html = '<input type="hidden" name="__VIEWSTATE" value="a&amp;b"><input type="text" name="searchTextBox" value="">';
  assert.deepEqual(readFormFields(html), { __VIEWSTATE: 'a&b' });
});

test('fetches a bill by opening the page and sending the search form', async () => {
  const calls: { url: string; method: string; body: string }[] = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? 'GET', body: String(init?.body ?? '') });
    const html = init?.method === 'POST' ? samplePage : '<input type="hidden" name="__VIEWSTATE" value="xyz">';
    return new Response(html, { status: 200 });
  }) as typeof fetch;

  const bill = await fetchPitcBill('lesco', '04000000000000U', fakeFetch);

  assert.equal(bill.amountDue, 12345);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://bill.pitc.com.pk/lescobill');
  assert.equal(calls[1].method, 'POST');
  const sent = new URLSearchParams(calls[1].body);
  assert.equal(sent.get('__VIEWSTATE'), 'xyz');
  assert.equal(sent.get('rbSearchByList'), 'refno');
  assert.equal(sent.get('searchTextBox'), '04000000000000');
  assert.equal(sent.get('ruCodeTextBox'), 'U');
});

test('gives a friendly error when the reference number is wrong', async () => {
  const fakeFetch = (async () =>
    new Response('<div id="ua">Invalid Reference Number</div>', { status: 200 })) as unknown as typeof fetch;
  await assert.rejects(fetchPitcBill('lesco', '04000000000000', fakeFetch), /Invalid Reference Number/);
});

test('gives a friendly error when the website cannot be reached', async () => {
  const fakeFetch = (async () => {
    throw new TypeError('Network request failed');
  }) as unknown as typeof fetch;
  await assert.rejects(fetchPitcBill('lesco', '04000000000000', fakeFetch), /Could not reach the bill website/);
});

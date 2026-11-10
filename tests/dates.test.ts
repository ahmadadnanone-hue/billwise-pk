// Checks the date and money helpers. Run with: npm test

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { daysUntil, dueStatus, formatRs, monthsAgo, parseTypedDate } from '../lib/dates';

test('reads dates the way people type them', () => {
  assert.equal(parseTypedDate('25-11-2026'), '2026-11-25');
  assert.equal(parseTypedDate('5/1/26'), '2026-01-05');
  assert.equal(parseTypedDate('31-02-2026'), null); // 31 February doesn't exist
  assert.equal(parseTypedDate('next week'), null);
});

test('counts days until a due date using calendar days, not the clock', () => {
  const evening = new Date(2026, 10, 10, 21, 0); // 10 Nov 2026, 9pm
  assert.equal(daysUntil('2026-11-10', evening), 0); // due today, even late in the day
  assert.equal(daysUntil('2026-11-07', evening), -3); // overdue
  assert.equal(daysUntil('2026-12-01', evening), 21);
});

test('status labels', () => {
  assert.equal(dueStatus('2000-01-01', false), 'overdue');
  assert.equal(dueStatus('2000-01-01', true), 'paid');
  assert.equal(dueStatus(null, false), 'unknown');
});

test('money and months', () => {
  assert.equal(formatRs(1234567), 'Rs. 1,234,567');
  assert.equal(monthsAgo(1, new Date(2026, 0, 15)), '2025-12'); // goes back across the new year
});

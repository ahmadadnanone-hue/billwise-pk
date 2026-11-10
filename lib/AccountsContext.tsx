// Keeps the list of accounts in one place so every screen sees the same data.
// (A React "context" is a shared box that any screen can read from.)

import { Platform } from 'react-native';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { canAutoFetch, getProvider } from '@/shared/providers';
import { fetchLatestBill, mergeBill } from './fetchBill';
import { loadAccounts, saveAccounts } from './storage';
import type { Account, BillRecord } from './types';

/** Check each auto-fetch bill at most this often when the app opens. */
const AUTO_REFRESH_AFTER_MS = 12 * 60 * 60 * 1000;

interface AccountsContextValue {
  accounts: Account[];
  loading: boolean;
  /** ids of accounts being checked right now */
  checking: string[];
  addAccount: (input: { providerId: string; reference: string; nickname: string }) => Account;
  removeAccount: (id: string) => void;
  refreshAccount: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  /** Saves a bill the user typed in. Replaces that month's bill if there is one. */
  saveManualBill: (accountId: string, record: BillRecord) => void;
  setPaid: (accountId: string, month: string, paid: boolean) => void;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used inside AccountsProvider');
  return ctx;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string[]>([]);
  // Always-current copy for async code (state inside callbacks can be out of date).
  const accountsRef = useRef<Account[]>([]);
  accountsRef.current = accounts;

  const update = useCallback((id: string, change: (a: Account) => Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? change(a) : a)));
  }, []);

  const refreshAccount = useCallback(
    async (id: string) => {
      const account = accountsRef.current.find((a) => a.id === id);
      const provider = account && getProvider(account.providerId);
      // Websites can't read other websites' pages, so automatic checks run in the phone app only.
      if (!account || !provider || !canAutoFetch(provider) || Platform.OS === 'web') return;

      setChecking((c) => [...c, id]);
      try {
        const record = await fetchLatestBill(account);
        update(id, (a) => ({
          ...a,
          lastCheckedAt: new Date().toISOString(),
          lastError: null,
          bills: mergeBill(a.bills, record),
        }));
      } catch (err) {
        update(id, (a) => ({ ...a, lastCheckedAt: new Date().toISOString(), lastError: (err as Error).message }));
      } finally {
        setChecking((c) => c.filter((x) => x !== id));
      }
    },
    [update],
  );

  const refreshAll = useCallback(async () => {
    // One at a time, to be gentle on the company websites.
    for (const a of accountsRef.current) await refreshAccount(a.id);
  }, [refreshAccount]);

  // 1. Load saved accounts, then 2. quietly check any that are out of date.
  useEffect(() => {
    loadAccounts().then(async (saved) => {
      accountsRef.current = saved;
      setAccounts(saved);
      setLoading(false);
      const stale = saved.filter(
        (a) => !a.lastCheckedAt || Date.now() - new Date(a.lastCheckedAt).getTime() > AUTO_REFRESH_AFTER_MS,
      );
      for (const a of stale) await refreshAccount(a.id);
    });
  }, [refreshAccount]);

  // Save to the phone whenever something changes.
  useEffect(() => {
    if (!loading) saveAccounts(accounts);
  }, [accounts, loading]);

  const addAccount: AccountsContextValue['addAccount'] = useCallback(
    ({ providerId, reference, nickname }) => {
      const account: Account = {
        id: newId(),
        providerId,
        reference,
        nickname: nickname || getProvider(providerId)?.name || 'My bill',
        createdAt: new Date().toISOString(),
        lastCheckedAt: null,
        lastError: null,
        bills: [],
      };
      accountsRef.current = [...accountsRef.current, account];
      setAccounts((prev) => [...prev, account]);
      refreshAccount(account.id);
      return account;
    },
    [refreshAccount],
  );

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const saveManualBill = useCallback(
    (accountId: string, record: BillRecord) =>
      update(accountId, (a) => ({ ...a, lastError: null, bills: mergeBill(a.bills, record) })),
    [update],
  );

  const setPaid = useCallback(
    (accountId: string, month: string, paid: boolean) =>
      update(accountId, (a) => ({ ...a, bills: a.bills.map((b) => (b.month === month ? { ...b, paid } : b)) })),
    [update],
  );

  return (
    <AccountsContext.Provider
      value={{ accounts, loading, checking, addAccount, removeAccount, refreshAccount, refreshAll, saveManualBill, setPaid }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

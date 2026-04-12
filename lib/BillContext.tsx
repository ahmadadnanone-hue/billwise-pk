import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Bill, HistoryEntry } from './types';
import { MONTHS } from './config';
import { loadBills, saveBills } from './storage';

interface BillContextType {
  bills: Bill[];
  loading: boolean;
  updateBillEntry: (billId: string, amount: number, usage: number, notes?: string) => void;
  updateBillNote: (billId: string, notes: string) => void;
  markPaid: (billId: string) => void;
  toggleReminder: (billId: string) => void;
  deleteHistory: (billId: string, historyIndex: number) => void;
}

const BillContext = createContext<BillContextType | null>(null);

export function useBills() {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBills must be used within BillProvider');
  return ctx;
}

export function BillProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills().then(b => {
      setBills(b);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && bills.length > 0) {
      saveBills(bills);
    }
  }, [bills, loading]);

  const today = new Date();

  const updateBillEntry = useCallback((billId: string, amount: number, usage: number, notes?: string) => {
    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      const newEntry: HistoryEntry = {
        month: MONTHS[today.getMonth()],
        year: today.getFullYear(),
        amount,
        usage,
        paid: false,
      };
      const history = [...b.history];
      const idx = history.findIndex(h => h.month === newEntry.month && h.year === newEntry.year);
      if (idx >= 0) history[idx] = newEntry;
      else history.push(newEntry);
      return { ...b, amount, usage, notes: notes ?? b.notes, history };
    }));
  }, [today]);

  const updateBillNote = useCallback((billId: string, notes: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, notes } : b));
  }, []);

  const markPaid = useCallback((billId: string) => {
    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      const history = [...b.history];
      const idx = history.findIndex(
        h => h.month === MONTHS[today.getMonth()] && h.year === today.getFullYear()
      );
      if (idx >= 0) history[idx] = { ...history[idx], paid: true };
      return { ...b, paidThisMonth: true, lastAmount: b.amount, lastUsage: b.usage, history };
    }));
  }, [today]);

  const toggleReminder = useCallback((billId: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, reminder: !b.reminder } : b));
  }, []);

  const deleteHistory = useCallback((billId: string, historyIndex: number) => {
    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      return { ...b, history: b.history.filter((_, i) => i !== historyIndex) };
    }));
  }, []);

  return (
    <BillContext.Provider value={{ bills, loading, updateBillEntry, updateBillNote, markPaid, toggleReminder, deleteHistory }}>
      {children}
    </BillContext.Provider>
  );
}

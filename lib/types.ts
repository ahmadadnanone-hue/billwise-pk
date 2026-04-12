export interface HistoryEntry {
  month: string;
  year: number;
  amount: number;
  usage: number;
  paid: boolean;
}

export interface Bill {
  id: string;
  label: string;
  icon: string;
  color: string;
  unit: string;
  dueDay: number;
  amount: number;
  lastAmount: number;
  usage: number;
  lastUsage: number;
  paidThisMonth: boolean;
  notes: string;
  reminder: boolean;
  history: HistoryEntry[];
}

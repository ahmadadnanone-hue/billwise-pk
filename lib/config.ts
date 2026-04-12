export interface BillType {
  id: string;
  label: string;
  icon: string;
  color: string;
  unit: string;
  dueDay: number;
}

export const BILL_TYPES: BillType[] = [
  { id: 'electricity', label: 'LESCO / Electricity', icon: 'bolt', color: '#F59E0B', unit: 'Units (kWh)', dueDay: 25 },
  { id: 'gas', label: 'Gas (SNGPL/SSGC)', icon: 'fire', color: '#EF4444', unit: 'SCF', dueDay: 20 },
  { id: 'internet', label: 'Internet', icon: 'globe', color: '#3B82F6', unit: 'GB', dueDay: 10 },
  { id: 'water', label: 'Water (WASA)', icon: 'tint', color: '#06B6D4', unit: 'Gallons', dueDay: 15 },
  { id: 'phone', label: 'Phone / Mobile', icon: 'mobile', color: '#8B5CF6', unit: 'Minutes', dueDay: 5 },
  { id: 'school', label: 'School Fees', icon: 'graduation-cap', color: '#10B981', unit: 'N/A', dueDay: 1 },
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface Expense {
  id?: string;
  who: string;
  amount: number;
  date: string; // YYYY-MM-DD
  where: string;
  category: string;
  notes: string;
  uid: string;
  createdAt: number;
}

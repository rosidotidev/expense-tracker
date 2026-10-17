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
  recurrent?: boolean; // stored only as true; absent means not recurrent
  debit?: boolean; // stored only as true; absent means not on debit
}

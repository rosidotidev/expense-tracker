import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private fb: FirebaseService) {}

  listenExpenses(): void {
    const uid = this.fb.uid;
    if (!uid) return;
    this.loadingSubject.next(true);
    this.fb.listen(`users/${uid}/expenses`).subscribe({
      next: (snapshot) => {
        const expenses: Expense[] = [];
        snapshot.forEach((child) => {
          expenses.push({ id: child.key!, ...child.val() });
        });
        expenses.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.createdAt - a.createdAt));
        this.expensesSubject.next(expenses);
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false)
    });
  }

  async addExpense(expense: Omit<Expense, 'id' | 'uid' | 'createdAt'>): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) throw new Error('Non autenticato');
    await this.fb.push(`users/${uid}/expenses`, {
      ...expense,
      uid,
      createdAt: Date.now()
    });
  }

  async deleteExpense(id: string): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) throw new Error('Non autenticato');
    await this.fb.remove(`users/${uid}/expenses/${id}`);
  }
}

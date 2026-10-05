import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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

  queryExpenses(year: number, month: number): Observable<Expense[]> {
    const uid = this.fb.uid;
    if (!uid) {
      return new Observable((subscriber) => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    if (year === -1) {
      return new Observable((subscriber) => {
        const sub = this.fb.listen(`users/${uid}/expenses`).subscribe((snapshot) => {
          subscriber.next(this.toExpenseList(snapshot));
        });
        return () => sub.unsubscribe();
      });
    }

    let start: string;
    let end: string;
    if (month === -1) {
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    } else {
      const mm = (month + 1).toString().padStart(2, '0');
      const lastDay = new Date(year, month + 1, 0).getDate();
      start = `${year}-${mm}-01`;
      end = `${year}-${mm}-${lastDay.toString().padStart(2, '0')}`;
    }

    return new Observable((subscriber) => {
      const sub = this.fb.listenRange(`users/${uid}/expenses`, 'date', start, end).subscribe((snapshot) => {
        subscriber.next(this.toExpenseList(snapshot));
      });
      return () => sub.unsubscribe();
    });
  }

  private toExpenseList(snapshot: any): Expense[] {
    const expenses: Expense[] = [];
    snapshot.forEach((child: any) => {
      expenses.push({ id: child.key, ...child.val() });
    });
    expenses.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.createdAt - a.createdAt));
    return expenses;
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

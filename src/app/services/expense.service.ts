import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { Expense } from '../models/expense.model';
import { planRecurringCopies, recurringWindow } from './recurring';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private recurringChecked = new Set<string>();

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
    const { recurrent, ...data } = expense;
    await this.fb.push(`users/${uid}/expenses`, {
      ...data,
      ...(recurrent === true ? { recurrent: true } : {}),
      uid,
      createdAt: Date.now()
    });
  }

  async setRecurrent(id: string, value: boolean): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) throw new Error('Non autenticato');
    const path = `users/${uid}/expenses/${id}/recurrent`;
    if (value) {
      await this.fb.set(path, true);
    } else {
      await this.fb.remove(path);
    }
  }

  /**
   * Once per user per session: copies last month's recurrent expenses into the current month
   * when the current month has none. Reads only the previous and current month (first emission).
   */
  async ensureRecurringForCurrentMonth(): Promise<void> {
    const uid = this.fb.uid;
    if (!uid || this.recurringChecked.has(uid)) return;
    this.recurringChecked.add(uid);
    try {
      const today = new Date();
      const { start, end } = recurringWindow(today);
      const snapshot = await firstValueFrom(
        this.fb.listenRange(`users/${uid}/expenses`, 'date', start, end).pipe(take(1))
      );
      const copies = planRecurringCopies(this.toExpenseList(snapshot), today);
      await Promise.all(
        copies.map(({ id, ...data }) => this.fb.set(`users/${uid}/expenses/${id}`, data))
      );
    } catch (error) {
      console.error('Recurring expenses check failed', error);
    }
  }

  async deleteExpense(id: string): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) throw new Error('Non autenticato');
    await this.fb.remove(`users/${uid}/expenses/${id}`);
  }
}

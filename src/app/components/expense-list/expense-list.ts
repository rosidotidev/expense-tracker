import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { ToastService } from '../../services/toast.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css'
})
export class ExpenseListComponent {
  expenses$;
  loading$;
  deleteConfirmId: string | null = null;

  constructor(
    private expenseService: ExpenseService,
    private toast: ToastService
  ) {
    this.expenses$ = this.expenseService.expenses$;
    this.loading$ = this.expenseService.loading$;
  }

  formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  formatAmount(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await this.expenseService.deleteExpense(id);
      this.toast.show('Spesa eliminata');
      this.deleteConfirmId = null;
    } catch {
      this.toast.show('Errore nella cancellazione', 'error');
    }
  }
}

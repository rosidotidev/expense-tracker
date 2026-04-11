import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { ToastService } from '../../services/toast.service';
import { Expense } from '../../models/expense.model';

type SortKey = 'who' | 'amount' | 'date' | 'where' | 'category' | 'notes';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css'
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  loading$;
  deleteConfirmId: string | null = null;

  // Filters
  selectedMonth: number;
  selectedYear: number;
  availableYears: number[] = [];

  months = [
    { value: -1, label: 'Tutti' },
    { value: 0, label: 'Gennaio' },
    { value: 1, label: 'Febbraio' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Aprile' },
    { value: 4, label: 'Maggio' },
    { value: 5, label: 'Giugno' },
    { value: 6, label: 'Luglio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Settembre' },
    { value: 9, label: 'Ottobre' },
    { value: 10, label: 'Novembre' },
    { value: 11, label: 'Dicembre' }
  ];

  // Sorting
  sortKey: SortKey = 'date';
  sortDir: SortDir = 'desc';

  // Pagination
  pageSize = 10;
  currentPage = 1;

  constructor(
    private expenseService: ExpenseService,
    private toast: ToastService
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
    this.loading$ = this.expenseService.loading$;
  }

  ngOnInit(): void {
    this.expenseService.expenses$.subscribe((expenses) => {
      this.expenses = expenses;
      this.updateAvailableYears();
    });
  }

  private updateAvailableYears(): void {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    this.expenses.forEach((e) => {
      const y = new Date(e.date).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

  get filteredExpenses(): Expense[] {
    return this.expenses.filter((e) => {
      const d = new Date(e.date);
      const matchYear = this.selectedYear === -1 || d.getFullYear() === this.selectedYear;
      const matchMonth = this.selectedMonth === -1 || d.getMonth() === this.selectedMonth;
      return matchYear && matchMonth;
    });
  }

  get sortedExpenses(): Expense[] {
    const list = [...this.filteredExpenses];
    const dir = this.sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;
      if (this.sortKey === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else {
        valA = (a[this.sortKey] || '').toLowerCase();
        valB = (b[this.sortKey] || '').toLowerCase();
      }
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedExpenses.length / this.pageSize));
  }

  get pagedExpenses(): Expense[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedExpenses.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = key === 'date' ? 'desc' : 'asc';
    }
    this.currentPage = 1;
  }

  getSortIcon(key: SortKey): string {
    if (this.sortKey !== key) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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

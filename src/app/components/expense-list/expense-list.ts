import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ExpenseService } from '../../services/expense.service';
import { PeopleService } from '../../services/people.service';
import { CategoryService } from '../../services/category.service';
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
export class ExpenseListComponent implements OnInit, OnDestroy {
  allExpenses = signal<Expense[]>([]);
  loading = signal(false);
  deleteConfirmId: string | null = null;
  private querySub: Subscription | null = null;

  // Filters
  selectedMonth: number;
  selectedYear: number;
  selectedPerson = '';
  selectedCategory = '';
  availableYears: number[] = [];
  people: string[] = [];
  categories: string[] = [];

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
    private peopleService: PeopleService,
    private categoryService: CategoryService,
    private toast: ToastService
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
  }

  ngOnInit(): void {
    this.peopleService.people$.subscribe((p) => (this.people = p));
    this.categoryService.categories$.subscribe((c) => (this.categories = c));
    this.expenseService.expenses$.subscribe((expenses) => {
      const years = new Set<number>();
      years.add(new Date().getFullYear());
      expenses.forEach((e) => {
        const y = new Date(e.date).getFullYear();
        if (!isNaN(y)) years.add(y);
      });
      this.availableYears = Array.from(years).sort((a, b) => b - a);
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  onPeriodChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onLocalFilterChange(): void {
    this.currentPage = 1;
  }

  private loadData(): void {
    this.loading.set(true);
    this.querySub?.unsubscribe();
    this.querySub = this.expenseService.queryExpenses(this.selectedYear, this.selectedMonth).subscribe((expenses) => {
      this.allExpenses.set(expenses);
      this.loading.set(false);
    });
  }

  get filteredExpenses(): Expense[] {
    return this.allExpenses().filter((e) => {
      const matchPerson = !this.selectedPerson || e.who === this.selectedPerson;
      const matchCategory = !this.selectedCategory || e.category === this.selectedCategory;
      return matchPerson && matchCategory;
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

  categoryBadgeClass(category: string): string {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
    }
    return `badge-${hash % 6}`;
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  async toggleRecurrent(expense: Expense): Promise<void> {
    try {
      await this.expenseService.setRecurrent(expense.id!, !expense.recurrent);
      this.toast.show(expense.recurrent ? 'Spesa non più ricorrente' : 'Spesa segnata come ricorrente');
    } catch {
      this.toast.show('Errore nel salvataggio', 'error');
    }
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

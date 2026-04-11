import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class OverviewComponent implements OnInit {
  expenses: Expense[] = [];

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

  constructor(private expenseService: ExpenseService) {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();
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
      const matchYear = d.getFullYear() === this.selectedYear;
      const matchMonth = this.selectedMonth === -1 || d.getMonth() === this.selectedMonth;
      return matchYear && matchMonth;
    });
  }

  get totalAmount(): string {
    const sum = this.filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    return sum.toFixed(2);
  }

  get expenseCount(): number {
    return this.filteredExpenses.length;
  }

  get averageAmount(): string {
    if (this.expenseCount === 0) return '0.00';
    return (parseFloat(this.totalAmount) / this.expenseCount).toFixed(2);
  }

  get perPersonTotals(): { name: string; total: string }[] {
    const map = new Map<string, number>();
    this.filteredExpenses.forEach((e) => {
      map.set(e.who, (map.get(e.who) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total: total.toFixed(2) }))
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
  }
}

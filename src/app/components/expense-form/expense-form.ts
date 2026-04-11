import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { PeopleService } from '../../services/people.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css'
})
export class ExpenseFormComponent implements OnInit {
  who = '';
  amount: number | null = null;
  date = '';
  where = '';
  category = '';
  notes = '';
  loading = false;

  people: string[] = [];
  categories: string[] = [];

  constructor(
    private expenseService: ExpenseService,
    private peopleService: PeopleService,
    private categoryService: CategoryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.date = this.todayString();
    this.peopleService.people$.subscribe((p) => (this.people = p));
    this.categoryService.categories$.subscribe((c) => (this.categories = c));
  }

  async submit(): Promise<void> {
    if (!this.who) {
      this.toast.show('Seleziona chi ha speso', 'error');
      return;
    }
    if (!this.amount || this.amount <= 0) {
      this.toast.show('Inserisci un importo valido', 'error');
      return;
    }
    if (!this.date) {
      this.toast.show('Inserisci una data', 'error');
      return;
    }
    if (!this.where.trim()) {
      this.toast.show('Inserisci dove', 'error');
      return;
    }
    if (!this.category) {
      this.toast.show('Seleziona una categoria', 'error');
      return;
    }

    this.loading = true;
    try {
      await this.expenseService.addExpense({
        who: this.who,
        amount: parseFloat(this.amount.toFixed(2)),
        date: this.date,
        where: this.where.trim(),
        category: this.category,
        notes: this.notes.trim()
      });
      this.toast.show('Spesa aggiunta!');
      this.reset();
    } catch {
      this.toast.show('Errore nel salvataggio', 'error');
    } finally {
      this.loading = false;
    }
  }

  reset(): void {
    this.who = '';
    this.amount = null;
    this.date = this.todayString();
    this.where = '';
    this.category = '';
    this.notes = '';
  }

  private todayString(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }
}

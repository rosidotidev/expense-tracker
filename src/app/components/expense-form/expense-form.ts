import { Component, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { PeopleService } from '../../services/people.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css'
})
export class ExpenseFormComponent {
  loading = false;
  submitted = false;

  people: Signal<string[]>;
  categories: Signal<string[]>;

  form;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private peopleService: PeopleService,
    private categoryService: CategoryService,
    private toast: ToastService
  ) {
    this.people = toSignal(this.peopleService.people$, { initialValue: [] as string[] });
    this.categories = toSignal(this.categoryService.categories$, { initialValue: [] as string[] });
    this.form = this.fb.group({
      who: ['', Validators.required],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      date: [this.todayString(), Validators.required],
      where: ['', Validators.required],
      category: ['', Validators.required],
      notes: [''],
      recurrent: [false]
    });
  }

  get f() {
    return this.form.controls;
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      this.toast.show('Compila tutti i campi obbligatori', 'error');
      return;
    }

    const value = this.form.getRawValue();
    this.loading = true;
    try {
      await this.expenseService.addExpense({
        who: value.who!,
        amount: parseFloat(value.amount!.toFixed(2)),
        date: value.date!,
        where: value.where!.trim(),
        category: value.category!,
        notes: (value.notes ?? '').trim(),
        recurrent: value.recurrent === true
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
    this.submitted = false;
    this.form.reset({
      who: '',
      amount: null,
      date: this.todayString(),
      where: '',
      category: '',
      notes: '',
      recurrent: false
    });
  }

  private todayString(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }
}

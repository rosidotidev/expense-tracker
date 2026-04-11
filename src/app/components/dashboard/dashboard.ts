import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { ExpenseService } from '../../services/expense.service';
import { PeopleService } from '../../services/people.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { ExpenseListComponent } from '../expense-list/expense-list';
import { OverviewComponent } from '../overview/overview';
import { PeopleComponent } from '../people/people';
import { CategoriesComponent } from '../categories/categories';

type Tab = 'registra' | 'storico' | 'riepilogo' | 'persone' | 'categorie';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ExpenseFormComponent,
    ExpenseListComponent,
    OverviewComponent,
    PeopleComponent,
    CategoriesComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  activeTab: Tab = 'registra';

  tabs: { key: Tab; label: string }[] = [
    { key: 'registra', label: 'Registra spesa' },
    { key: 'storico', label: 'Storico' },
    { key: 'riepilogo', label: 'Riepilogo' },
    { key: 'persone', label: 'Persone' },
    { key: 'categorie', label: 'Categorie' }
  ];

  constructor(
    private fb: FirebaseService,
    private router: Router,
    private expenseService: ExpenseService,
    private peopleService: PeopleService,
    private categoryService: CategoryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.expenseService.listenExpenses();
    this.peopleService.listenPeople();
    this.categoryService.listenCategories();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  async logout(): Promise<void> {
    await this.fb.logout();
    this.toast.show('Disconnesso con successo');
    this.router.navigate(['/login']);
  }

  get userEmail(): string {
    return this.fb.currentUser?.email ?? '';
  }
}

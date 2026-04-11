import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class CategoriesComponent {
  categories$;
  newCategory = '';
  loading = false;

  constructor(
    private categoryService: CategoryService,
    private toast: ToastService
  ) {
    this.categories$ = this.categoryService.categories$;
  }

  async add(): Promise<void> {
    if (!this.newCategory.trim()) {
      this.toast.show('La categoria non può essere vuota', 'error');
      return;
    }
    this.loading = true;
    try {
      await this.categoryService.addCategory(this.newCategory);
      this.toast.show('Categoria aggiunta!');
      this.newCategory = '';
    } catch (err: any) {
      this.toast.show(err.message || 'Errore', 'error');
    } finally {
      this.loading = false;
    }
  }

  async remove(name: string): Promise<void> {
    await this.categoryService.removeCategory(name);
    this.toast.show('Categoria rimossa');
  }
}

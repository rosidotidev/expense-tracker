import { Injectable } from '@angular/core';
import { BehaviorSubject, take } from 'rxjs';
import { FirebaseService } from './firebase.service';

const DEFAULT_CATEGORIES = ['Cibo', 'Trasporti', 'Intrattenimento', 'Alloggio', 'Shopping', 'Altro'];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<string[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(private fb: FirebaseService) {}

  listenCategories(): void {
    const uid = this.fb.uid;
    if (!uid) return;
    this.fb.listen(`users/${uid}/categories`).subscribe((snapshot) => {
      const categories: string[] = [];
      snapshot.forEach((child) => {
        categories.push(child.val());
      });
      if (categories.length === 0) {
        this.initDefaults(uid);
      } else {
        this.categoriesSubject.next(categories.sort());
      }
    });
  }

  private async initDefaults(uid: string): Promise<void> {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.fb.push(`users/${uid}/categories`, cat);
    }
  }

  async addCategory(name: string): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) throw new Error('Non autenticato');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('La categoria non può essere vuota');
    const current = this.categoriesSubject.value;
    if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Categoria già esistente');
    }
    await this.fb.push(`users/${uid}/categories`, trimmed);
  }

  async removeCategory(name: string): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) return;
    this.fb.listen(`users/${uid}/categories`).pipe(take(1)).subscribe({
      next: (snapshot) => {
        snapshot.forEach((child) => {
          if (child.val() === name) {
            this.fb.remove(`users/${uid}/categories/${child.key}`);
          }
        });
      }
    });
  }
}

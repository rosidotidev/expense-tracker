import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private peopleSubject = new BehaviorSubject<string[]>([]);
  people$ = this.peopleSubject.asObservable();

  constructor(private fb: FirebaseService) {}

  listenPeople(): void {
    const uid = this.fb.uid;
    if (!uid) return;
    this.fb.listen(`users/${uid}/people`).subscribe((snapshot) => {
      const people: string[] = [];
      snapshot.forEach((child) => {
        people.push(child.val());
      });
      this.peopleSubject.next(people.sort());
    });
  }

  async addPerson(name: string): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) throw new Error('Non autenticato');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Il nome non può essere vuoto');
    const current = this.peopleSubject.value;
    if (current.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Persona già esistente');
    }
    await this.fb.push(`users/${uid}/people`, trimmed);
  }

  async removePerson(name: string): Promise<void> {
    const uid = this.fb.uid;
    if (!uid) return;
    // Find the key for this person
    this.fb.listen(`users/${uid}/people`).subscribe({
      next: (snapshot) => {
        snapshot.forEach((child) => {
          if (child.val() === name) {
            this.fb.remove(`users/${uid}/people/${child.key}`);
          }
        });
      }
    });
  }
}

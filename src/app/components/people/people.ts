import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeopleService } from '../../services/people.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './people.html',
  styleUrl: './people.css'
})
export class PeopleComponent {
  people$;
  newPerson = '';
  loading = false;

  constructor(
    private peopleService: PeopleService,
    private toast: ToastService
  ) {
    this.people$ = this.peopleService.people$;
  }

  async add(): Promise<void> {
    if (!this.newPerson.trim()) {
      this.toast.show('Il nome non può essere vuoto', 'error');
      return;
    }
    this.loading = true;
    try {
      await this.peopleService.addPerson(this.newPerson);
      this.toast.show('Persona aggiunta!');
      this.newPerson = '';
    } catch (err: any) {
      this.toast.show(err.message || 'Errore', 'error');
    } finally {
      this.loading = false;
    }
  }

  async remove(name: string): Promise<void> {
    await this.peopleService.removePerson(name);
    this.toast.show('Persona rimossa');
  }
}

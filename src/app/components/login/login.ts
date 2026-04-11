import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  isSignup = false;
  loading = false;

  constructor(
    private fb: FirebaseService,
    private router: Router,
    private toast: ToastService
  ) {}

  async submit(): Promise<void> {
    if (!this.email || !this.password) {
      this.toast.show('Compila tutti i campi', 'error');
      return;
    }
    this.loading = true;
    try {
      if (this.isSignup) {
        await this.fb.signup(this.email, this.password);
        this.toast.show('Account creato con successo!');
      } else {
        await this.fb.login(this.email, this.password);
        this.toast.show('Accesso effettuato!');
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = this.getErrorMessage(err.code);
      this.toast.show(msg, 'error');
    } finally {
      this.loading = false;
    }
  }

  toggleMode(): void {
    this.isSignup = !this.isSignup;
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'Utente non trovato';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Password errata';
      case 'auth/email-already-in-use':
        return 'Email già in uso';
      case 'auth/weak-password':
        return 'Password troppo debole (minimo 6 caratteri)';
      case 'auth/invalid-email':
        return 'Email non valida';
      default:
        return 'Errore di autenticazione';
    }
  }
}

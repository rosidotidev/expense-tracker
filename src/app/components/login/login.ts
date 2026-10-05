import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loading = false;
  submitted = false;
  form;

  constructor(
    private fb: FormBuilder,
    private firebase: FirebaseService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      this.toast.show('Compila tutti i campi obbligatori', 'error');
      return;
    }

    this.loading = true;
    try {
      await this.firebase.login(this.email.value!, this.password.value!);
      this.toast.show('Accesso effettuato!');
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = this.getErrorMessage(err.code);
      this.toast.show(msg, 'error');
    } finally {
      this.loading = false;
    }
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

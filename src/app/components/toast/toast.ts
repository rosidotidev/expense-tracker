import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent {
  messages$;

  constructor(private toastService: ToastService) {
    this.messages$ = this.toastService.messages$;
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}

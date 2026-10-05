import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();
  private counter = 0;

  show(text: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.counter;
    const msg: ToastMessage = { text, type, id };
    this.messagesSubject.next([...this.messagesSubject.value, msg]);
    setTimeout(() => this.dismiss(id), 2000);
  }

  dismiss(id: number): void {
    this.messagesSubject.next(this.messagesSubject.value.filter((m) => m.id !== id));
  }
}

import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Lightweight mocks for DataSnapshot interface used by services
class MockChildSnapshot {
  constructor(public readonly key: string, private _value: any) {}
  val(): any { return this._value; }
}

class MockDataSnapshot {
  constructor(private data: Record<string, any> | null) {}
  forEach(callback: (child: MockChildSnapshot) => boolean | void): void {
    if (!this.data) return;
    for (const [key, val] of Object.entries(this.data)) {
      if (callback(new MockChildSnapshot(key, val)) === true) break;
    }
  }
  val(): any { return this.data; }
}

// Fake user matching the subset of firebase User used by the app
const MOCK_USER: any = {
  uid: 'mock-user-001',
  email: 'demo@example.com'
};

@Injectable()
export class MockFirebaseService {
  // In-memory database
  private store: Record<string, any> = {};
  // Listeners per path => BehaviorSubject
  private subjects = new Map<string, BehaviorSubject<any>>();
  private idCounter = 0;

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  private authReady = new BehaviorSubject<boolean>(true);
  authReady$ = this.authReady.asObservable();

  constructor(private ngZone: NgZone) {
    // Auto-login on startup
    this.userSubject.next(MOCK_USER);
  }

  get currentUser(): any {
    return this.userSubject.value;
  }

  get uid(): string | null {
    return this.currentUser?.uid ?? null;
  }

  // Auth
  login(_email: string, _password: string): Promise<void> {
    this.userSubject.next(MOCK_USER);
    return Promise.resolve();
  }

  signup(_email: string, _password: string): Promise<void> {
    this.userSubject.next(MOCK_USER);
    return Promise.resolve();
  }

  logout(): Promise<void> {
    this.userSubject.next(null);
    return Promise.resolve();
  }

  // Database
  listRef(_path: string): any {
    return null;
  }

  push(path: string, data: any): Promise<string | null> {
    const key = 'mock-' + (++this.idCounter);
    this.setNestedValue(path + '/' + key, data);
    this.emitPath(path);
    return Promise.resolve(key);
  }

  set(path: string, data: any): Promise<void> {
    this.setNestedValue(path, data);
    // Emit on parent path as well
    const parent = path.substring(0, path.lastIndexOf('/'));
    if (parent) this.emitPath(parent);
    this.emitPath(path);
    return Promise.resolve();
  }

  remove(path: string): Promise<void> {
    this.deleteNestedValue(path);
    const parent = path.substring(0, path.lastIndexOf('/'));
    if (parent) this.emitPath(parent);
    return Promise.resolve();
  }

  listen(path: string): Observable<any> {
    return new Observable((subscriber) => {
      const subject = this.getOrCreateSubject(path);
      const sub = subject.subscribe((snapshot) => {
        this.ngZone.run(() => subscriber.next(snapshot));
      });
      return () => sub.unsubscribe();
    });
  }

  listenOrdered(path: string, _orderBy: string): Observable<any> {
    return this.listen(path);
  }

  // --- Internal helpers ---

  private getOrCreateSubject(path: string): BehaviorSubject<MockDataSnapshot> {
    if (!this.subjects.has(path)) {
      const data = this.getNestedValue(path);
      this.subjects.set(path, new BehaviorSubject(new MockDataSnapshot(data && typeof data === 'object' ? data : null)));
    }
    return this.subjects.get(path)!;
  }

  private emitPath(path: string): void {
    if (this.subjects.has(path)) {
      const data = this.getNestedValue(path);
      const snapshot = new MockDataSnapshot(data && typeof data === 'object' ? data : null);
      this.subjects.get(path)!.next(snapshot);
    }
  }

  private getNestedValue(path: string): any {
    const parts = path.split('/').filter(Boolean);
    let current: any = this.store;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return null;
      current = current[part];
    }
    return current ?? null;
  }

  private setNestedValue(path: string, value: any): void {
    const parts = path.split('/').filter(Boolean);
    let current: any = this.store;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] == null || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  private deleteNestedValue(path: string): void {
    const parts = path.split('/').filter(Boolean);
    let current: any = this.store;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] == null) return;
      current = current[parts[i]];
    }
    delete current[parts[parts.length - 1]];
  }
}

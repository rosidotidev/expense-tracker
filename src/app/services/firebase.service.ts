import { Injectable, NgZone } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getDatabase,
  Database,
  ref,
  push,
  set,
  remove,
  onValue,
  query,
  orderByChild,
  DataSnapshot
} from 'firebase/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Database;

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private authReady = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReady.asObservable();

  constructor(private ngZone: NgZone) {
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getDatabase(this.app);

    onAuthStateChanged(this.auth, (user) => {
      this.ngZone.run(() => {
        this.userSubject.next(user);
        this.authReady.next(true);
      });
    });
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  get uid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  // Auth methods
  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() => {});
  }

  signup(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password).then(() => {});
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // Database methods
  listRef(path: string) {
    return ref(this.db, path);
  }

  push(path: string, data: any): Promise<string | null> {
    const listRef = ref(this.db, path);
    const newRef = push(listRef);
    return set(newRef, data).then(() => newRef.key);
  }

  set(path: string, data: any): Promise<void> {
    return set(ref(this.db, path), data);
  }

  remove(path: string): Promise<void> {
    return remove(ref(this.db, path));
  }

  listen(path: string): Observable<DataSnapshot> {
    return new Observable((subscriber) => {
      const dbRef = ref(this.db, path);
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          this.ngZone.run(() => subscriber.next(snapshot));
        },
        (error) => {
          this.ngZone.run(() => subscriber.error(error));
        }
      );
      return () => unsubscribe();
    });
  }

  listenOrdered(path: string, orderBy: string): Observable<DataSnapshot> {
    return new Observable((subscriber) => {
      const dbRef = query(ref(this.db, path), orderByChild(orderBy));
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          this.ngZone.run(() => subscriber.next(snapshot));
        },
        (error) => {
          this.ngZone.run(() => subscriber.error(error));
        }
      );
      return () => unsubscribe();
    });
  }
}

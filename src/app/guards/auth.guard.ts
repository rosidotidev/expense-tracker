import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const fb = inject(FirebaseService);
  const router = inject(Router);

  return fb.authReady$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (fb.currentUser) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};

export const loginGuard: CanActivateFn = () => {
  const fb = inject(FirebaseService);
  const router = inject(Router);

  return fb.authReady$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (!fb.currentUser) {
        return true;
      }
      router.navigate(['/']);
      return false;
    })
  );
};

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { FirebaseService } from './services/firebase.service';
import { MockFirebaseService } from './services/mock-firebase.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: FirebaseService,
      useClass: environment.useMock ? MockFirebaseService : FirebaseService
    }
  ]
};

import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { CartStore } from './core/stores/cart.store';

function initializeCart(cartStore: CartStore): () => void {
  return () => {
    cartStore.loadCart();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCart,
      deps: [CartStore],
      multi: true,
    },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
  ],
};

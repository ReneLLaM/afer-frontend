import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = extractMessage(error);

        if (error.status === 429) {
          toastService.warning('Demasiados intentos', message || 'Por favor espera unos segundos antes de intentarlo de nuevo.');
        }
      }

      return throwError(() => error);
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string | null {
  if (error.error?.message) {
    return typeof error.error.message === 'string'
      ? error.error.message
      : Array.isArray(error.error.message)
        ? error.error.message[0]
        : null;
  }
  return null;
}
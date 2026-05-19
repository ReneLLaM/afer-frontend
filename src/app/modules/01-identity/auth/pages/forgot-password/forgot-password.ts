import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly fb          = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef  = inject(DestroyRef);

  isPosting  = signal(false);
  hasError   = signal(false);
  hasSuccess = signal(false);
  message    = signal('');

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);
    this.hasSuccess.set(false);

    const { email } = this.forgotForm.getRawValue();

    this.authService.forgotPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isPosting.set(false);
          this.hasSuccess.set(true);
          this.message.set(res.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
        },
        error: (err: HttpErrorResponse) => {
          this.isPosting.set(false);
          this.hasError.set(true);

          if (err.status === 429) {
            this.message.set('Has excedido el límite de solicitudes de recuperación. Por favor, espera un momento.');
          } else {
            this.message.set(err?.error?.message || 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
          }
        }
      });
  }
}

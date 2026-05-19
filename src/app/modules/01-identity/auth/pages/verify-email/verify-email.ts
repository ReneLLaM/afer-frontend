import { Component, inject, signal, ChangeDetectionStrategy, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'verify-email-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage implements OnDestroy {
  private readonly fb          = inject(NonNullableFormBuilder);
  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore   = inject(AuthStore);
  private readonly destroyRef  = inject(DestroyRef);
  public readonly activatedRoute = inject(ActivatedRoute);

  isPosting   = signal(false);
  isResending = signal(false);
  hasError    = signal(false);
  hasSuccess  = signal(false);
  message     = signal('');

  resendAttempts = signal<number[]>([]);
  resendCooldown = signal(0);
  
  private cooldownInterval?: ReturnType<typeof setInterval>;
  private redirectTimeout?: ReturnType<typeof setTimeout>;

  verifyForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnDestroy(): void {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    if (this.redirectTimeout) clearTimeout(this.redirectTimeout);
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);
    this.hasSuccess.set(false);

    const { code } = this.verifyForm.getRawValue();

    this.authService.verifyEmail(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isPosting.set(false);
          this.hasSuccess.set(true);
          this.message.set(res.message);
          
          this.authStore.checkStatusResource.reload();
          
          this.redirectTimeout = setTimeout(() => {
            const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '/';
            this.router.navigateByUrl(returnUrl);
          }, 2000);
        },
        error: (err: HttpErrorResponse) => {
          this.isPosting.set(false);
          this.hasError.set(true);

          if (err.status === 429) {
            this.message.set('Has excedido el límite de intentos de verificación. Por favor, espera un momento.');
          } else {
            this.message.set(err?.error?.message || 'Error al verificar el código.');
          }
        }
      });
  }

  onResendCode(): void {
    if (this.resendCooldown() > 0) return;

    const user = this.authStore.user();
    if (!user?.email) {
      this.hasError.set(true);
      this.message.set('No se encontró el correo en sesión. Inicia sesión primero.');
      return;
    }

    const now = Date.now();
    const validAttempts = this.resendAttempts().filter(time => now - time < 60000);
    validAttempts.push(now);
    
    this.resendAttempts.set(validAttempts);

    if (validAttempts.length >= 2) {
      const remainingTime = 60000 - (now - validAttempts[0]);
      this.resendCooldown.set(Math.ceil(remainingTime / 1000));
      
      this.cooldownInterval = setInterval(() => {
        const current = this.resendCooldown();
        if (current <= 1) {
          clearInterval(this.cooldownInterval);
          this.resendCooldown.set(0);
          this.resendAttempts.set([]);
        } else {
          this.resendCooldown.set(current - 1);
        }
      }, 1000);
    }

    this.isResending.set(true);
    this.hasError.set(false);
    this.hasSuccess.set(false);

    this.authService.resendVerificationEmail(user.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isResending.set(false);
          this.hasSuccess.set(true);
          this.message.set(res.message);
        },
        error: (err: HttpErrorResponse) => {
          this.isResending.set(false);
          this.hasError.set(true);
          
          if (err.status === 429) {
            this.message.set('Has excedido el límite de intentos. Espera un momento.');
          } else {
            this.message.set(err?.error?.message || 'Error al reenviar el código.');
          }
        }
      });
  }
}
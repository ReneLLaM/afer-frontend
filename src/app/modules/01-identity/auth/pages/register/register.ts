import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb         = inject(NonNullableFormBuilder);
  private readonly router     = inject(Router);
  private readonly authStore  = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  hasError              = signal(false);
  errorMessage         = signal('');
  isPosting            = signal(false);
  showPassword         = signal(false);
  showConfirmPassword  = signal(false);

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);

    const { fullName, email, password } = this.registerForm.getRawValue();

    this.authStore
      .register({ fullName, email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isPosting.set(false);
          this.router.navigate(['/verificar-correo']);
        },
        error: (err: HttpErrorResponse) => {
          this.isPosting.set(false);
          this.hasError.set(true);
          
          if (err.status === 429) {
            this.errorMessage.set('Has excedido el límite de solicitudes de registro. Por favor, espera un momento.');
          } else {
            this.errorMessage.set(err?.error?.message || 'Error al crear la cuenta.');
          }
        }
      });
  }

  onGoogleLogin(): void {
    window.location.href = this.authStore.getGoogleAuthUrl();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }
}

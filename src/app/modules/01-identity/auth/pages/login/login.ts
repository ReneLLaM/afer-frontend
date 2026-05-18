import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb        = inject(FormBuilder);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  hasError  = signal(false);
  isPosting = signal(false);

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);

    const { email, password } = this.loginForm.getRawValue();

    this.authStore
      .login({ email: email!, password: password! })
      .subscribe((success) => {
        this.isPosting.set(false);

        if (success) {
          this.router.navigate(['/']);
        } else {
          this.hasError.set(true);
          setTimeout(() => this.hasError.set(false), 3000);
        }
      });
  }

  onGoogleLogin(): void {
    // Redirige al usuario a la URL del backend para iniciar OAuth con Google
    window.location.href = this.authStore.getGoogleAuthUrl();
  }
}

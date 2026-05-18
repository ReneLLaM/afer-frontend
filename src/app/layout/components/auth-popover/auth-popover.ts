import { Component, signal, ChangeDetectionStrategy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../../modules/01-identity/auth/store/auth.store';

@Component({
  selector: 'auth-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-popover.html',
  styleUrl: './auth-popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPopover {
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly user            = this.authStore.user;

  isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  navigateToLogin(): void {
    this.close();
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.close();
    this.router.navigate(['/register']);
  }

  onLogout(): void {
    this.close();
    this.authStore.logout();
  }
}

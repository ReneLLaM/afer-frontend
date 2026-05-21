import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../modules/01-identity/auth/store/auth.store';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'admin-header',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeader {
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly themeService = inject(ThemeService);

  user = this.authStore.user;

  getInitial(): string {
    return this.user()?.fullName?.charAt(0).toUpperCase() ?? '?';
  }

  navigateToStore(): void {
    this.router.navigate(['/']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.authStore.logout();
  }
}

import { Component, inject, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../../modules/01-identity/auth/store/auth.store';
import { ThemeService } from '../../../../../core/services/theme.service';
import type { AdminNavItem } from '../../admin-nav.config';

@Component({
  selector: 'admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebar {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  items = input.required<AdminNavItem[]>();
  isCollapsed = input.required<boolean>();
  collapsedChange = output<boolean>();

  isMobileOpen = signal(false);

  filteredItems = computed(() =>
    this.items().filter(item =>
      this.authStore.hasAnyPermission(item.permissions)
    )
  );

  user = this.authStore.user;

  toggleCollapse(): void {
    const next = !this.isCollapsed();
    this.collapsedChange.emit(next);
  }

  toggleMobile(): void {
    this.isMobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  getInitial(): string {
    return this.user()?.fullName?.charAt(0).toUpperCase() ?? '?';
  }

  navigateToStore(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authStore.logout();
  }
}

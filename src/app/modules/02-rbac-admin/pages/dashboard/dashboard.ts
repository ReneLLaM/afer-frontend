import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../01-identity/auth/store/auth.store';
import { ADMIN_NAV_ITEMS } from '../../admin-nav.config';

@Component({
  selector: 'dashboard-page',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly authStore = inject(AuthStore);

  user = this.authStore.user;
  permissions = this.authStore.permissions;

  accessibleModules = computed(() =>
    ADMIN_NAV_ITEMS.filter(item =>
      this.authStore.hasAnyPermission(item.permissions)
    )
  );
}

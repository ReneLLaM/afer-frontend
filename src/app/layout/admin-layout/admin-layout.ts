import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';
import { ADMIN_NAV_ITEMS } from '../../modules/02-rbac-admin/admin-nav.config';
import { AdminSidebar } from '../../modules/02-rbac-admin/components/admin-sidebar/admin-sidebar';
import { AdminHeader } from '../../modules/02-rbac-admin/components/admin-header/admin-header';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebar, AdminHeader],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  navItems = ADMIN_NAV_ITEMS;
  isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    const hasAnyAdminPermission = this.navItems.some(item =>
      this.authStore.hasAnyPermission(item.permissions)
    );

    if (!hasAnyAdminPermission) {
      this.router.navigate(['/']);
    }
  }

  onSidebarToggle(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }
}

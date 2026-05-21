import { Component, inject, HostBinding, HostListener, ChangeDetectionStrategy, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../../modules/01-identity/auth/store/auth.store';
import { FavoritesStore } from '../../../../../core/stores/favorites.store';
import { CartStore } from '../../../../../core/stores/cart.store';
import { DialogService } from '../../../../../shared/services/dialog.service';

@Component({
  selector: 'app-menu-mobile',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './menu-mobile.html',
  styleUrl: './menu-mobile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuMobile {
  themeService   = inject(ThemeService);
  authStore      = inject(AuthStore);
  favoritesStore = inject(FavoritesStore);
  cartStore = inject(CartStore);
  router         = inject(Router);
  private readonly dialogService = inject(DialogService);

  @HostBinding('class.is-open') isOpen = false;

  hasAdminAccess = computed(() => this.authStore.permissions().length > 0);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) this.close();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.updateBodyScroll();
  }

  close(): void {
    this.isOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll(): void {
    document.body.style.overflow = this.isOpen ? 'hidden' : '';
  }

  async goToFavorites(): Promise<void> {
    this.close();
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/mis-favoritos']);
    } else {
      const confirm = await this.dialogService.confirm({
        title: 'Iniciar Sesión',
        message: 'Debes iniciar sesión para ver tus productos favoritos.',
        confirmText: 'Ir a Login',
        cancelText: 'Más tarde',
        type: 'info'
      });

      if (confirm) {
        this.router.navigate(['/iniciar-sesion'], { queryParams: { returnUrl: '/mis-favoritos' } });
      }
    }
  }

  navigateToAdmin(): void {
    this.close();
    this.router.navigate(['/admin']);
  }
}

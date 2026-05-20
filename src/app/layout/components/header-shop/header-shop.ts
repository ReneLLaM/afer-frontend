import { Component, effect, inject, signal, untracked, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Menu } from './components/menu/menu';
import { ThemeService } from '../../../core/services/theme.service';
import { MenuMobile } from './components/menu-mobile/menu-mobile';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthPopover } from '../auth-popover/auth-popover';
import { AuthStore } from '../../../modules/01-identity/auth/store/auth.store';
import { FavoritesStore } from '../../../core/stores/favorites.store';
import { CartStore } from '../../../core/stores/cart.store';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'header-shop',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, Menu, MenuMobile, RouterLink, FormsModule, AuthPopover],
  templateUrl: './header-shop.html',
  styleUrl: './header-shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderShop {
  themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);
  readonly favoritesStore = inject(FavoritesStore);
  readonly cartStore = inject(CartStore);
  private readonly dialogService = inject(DialogService);
  searchTerm = signal<string>('');

  private readonly queryParams = toSignal(this.route.queryParams);

  readonly popover = viewChild.required(AuthPopover);

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const searchFromUrl = params?.['search'] || '';

      untracked(() => {
        if (this.searchTerm() !== searchFromUrl) {
          this.searchTerm.set(searchFromUrl);
        }
      });
    });
  }

  onSearch(): void {
    const term = this.searchTerm().trim();
    const isProductsPage = this.router.url.includes('/productos');

    this.router.navigate(['/productos'], {
      queryParams: { search: term || null, page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: isProductsPage,
    });
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.onSearch();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  openAuthPopover(): void {
    this.popover().open();
  }

  async goToFavorites(): Promise<void> {
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
}

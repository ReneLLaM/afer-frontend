import { Component, effect, inject, signal, untracked, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Menu } from './components/menu/menu';
import { ThemeService } from '../../../core/services/theme.service';
import { MenuMobile } from './components/menu-mobile/menu-mobile';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'header-shop',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, Menu, MenuMobile, RouterLink, FormsModule],
  templateUrl: './header-shop.html',
  styleUrl: './header-shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderShop {
  themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  searchTerm = signal<string>('');

  private readonly queryParams = toSignal(this.route.queryParams);

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
}

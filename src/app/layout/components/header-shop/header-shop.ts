import { Component, effect, inject, signal, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Menu } from './components/menu/menu';
import { ThemeService } from '../../../core/services/theme.service';
import { MenuMobile } from "./components/menu-mobile/menu-mobile";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'header-shop',
  imports: [MatButtonModule, MatIconModule, Menu, MenuMobile, RouterLink, FormsModule],
  templateUrl: './header-shop.html',
  styleUrl: './header-shop.scss',
})
export class HeaderShop {
  themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  searchTerm = signal<string>('');

  // Sincronizar el input con la URL
  private readonly queryParams = toSignal(this.route.queryParams);

  constructor() {
    effect(() => {
      // Obtenemos el valor de la URL
      const params = this.queryParams();
      const searchFromUrl = params?.['search'] || '';
      
      // Actualizamos el signal interno sin crear una dependencia circular
      // y solo si el valor de la URL realmente cambió respecto a lo que tenemos
      untracked(() => {
        if (this.searchTerm() !== searchFromUrl) {
          this.searchTerm.set(searchFromUrl);
        }
      });
    });
  }

  onSearch() {
    const term = this.searchTerm().trim();
    
    // Si estamos en otra página, vamos a /productos
    // Si ya estamos en /productos, usamos navegación relativa para mergear
    const isProductsPage = this.router.url.includes('/productos');
    
    this.router.navigate(['/productos'], {
      queryParams: { search: term || null, page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: isProductsPage // Evitar llenar el historial si solo filtramos
    });
  }

  clearSearch() {
    this.searchTerm.set('');
    this.onSearch();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}

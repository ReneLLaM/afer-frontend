import { Component, inject, HostBinding, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../../modules/01-identity/auth/store/auth.store';
import { FavoritesStore } from '../../../../../core/stores/favorites.store';

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
  router         = inject(Router);

  @HostBinding('class.is-open') isOpen = false;

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
}

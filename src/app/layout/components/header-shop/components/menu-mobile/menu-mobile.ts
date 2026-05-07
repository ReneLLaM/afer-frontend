import { Component, inject, HostBinding, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu-mobile',
  imports: [MatButtonModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './menu-mobile.html',
  styleUrl: './menu-mobile.scss',
})
export class MenuMobile {
  themeService = inject(ThemeService);

  @HostBinding('class.is-open') isOpen = false;

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.close();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.updateBodyScroll();
  }

  close() {
    this.isOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

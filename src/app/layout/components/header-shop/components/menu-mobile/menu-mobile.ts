import { Component, inject, HostBinding, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu-mobile',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './menu-mobile.html',
  styleUrl: './menu-mobile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuMobile {
  themeService = inject(ThemeService);

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

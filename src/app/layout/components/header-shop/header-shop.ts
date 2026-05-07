import { Component, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Menu } from './components/menu/menu';
import { ThemeService } from '../../../core/services/theme.service';
import { MenuMobile } from "./components/menu-mobile/menu-mobile";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'header-shop',
  imports: [MatButtonModule, MatIconModule, Menu, MenuMobile, RouterLink],
  templateUrl: './header-shop.html',
  styleUrl: './header-shop.scss',
})
export class HeaderShop {
  themeService = inject(ThemeService);
}

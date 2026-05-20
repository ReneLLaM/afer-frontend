import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderShop } from '../components/header-shop/header-shop';
import { FooterShop } from '../components/footer-shop/footer-shop';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { CartStore } from '../../core/stores/cart.store';
import { CartSidebar } from '../../modules/03-commerce/ecommerce/components/cart-sidebar/cart-sidebar';

@Component({
  selector: 'shop-layout',
  standalone: true,
  imports: [HeaderShop, FooterShop, Breadcrumb, RouterOutlet, CartSidebar],
  templateUrl: './shop-layout.html',
  styleUrl: './shop-layout.scss',
})
export class ShopLayout {
  readonly cartStore = inject(CartStore);
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderShop } from '../components/header-shop/header-shop';
import { FooterShop } from '../components/footer-shop/footer-shop';

@Component({
  selector: 'shop-layout',
  imports: [HeaderShop, FooterShop, RouterOutlet],
  templateUrl: './shop-layout.html',
  styleUrl: './shop-layout.scss',
})
export class ShopLayout {}

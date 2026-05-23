import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/toast/toast';
import { Dialog } from './shared/dialog/dialog';
import { CartStore } from './core/stores/cart.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, Dialog],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly cartStore = inject(CartStore);

  ngOnInit(): void {
    this.cartStore.loadCart();
  }
}

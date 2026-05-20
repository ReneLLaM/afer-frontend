import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast';
import { DialogComponent } from './shared/dialog/dialog';
import { CartStore } from './core/stores/cart.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, DialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly cartStore = inject(CartStore);

  ngOnInit(): void {
    this.cartStore.loadCart();
  }
}

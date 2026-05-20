import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { CartStore } from '../../../../../core/stores/cart.store';
import { CartLineItem } from '../cart-line-item/cart-line-item';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CartLineItem],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartSidebar {
  readonly cartStore = inject(CartStore);

  isOpen = input.required<boolean>();
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onUpdateQuantity(itemId: string, quantity: number): void {
    this.cartStore.updateQuantity(itemId, quantity);
  }

  onRemoveItem(itemId: string): void {
    this.cartStore.removeItem(itemId);
  }
}

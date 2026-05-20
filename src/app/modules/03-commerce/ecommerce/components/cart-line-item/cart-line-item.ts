import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { CartItem } from '../../models/cart.model';
import { ProductImagePipe } from '../../pipes/product-image.pipe';

@Component({
  selector: 'app-cart-line-item',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './cart-line-item.html',
  styleUrl: './cart-line-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartLineItem {
  private readonly router = inject(Router);

  item = input.required<CartItem>();
  isUpdating = input<boolean>(false);

  quantityChange = output<number>();
  remove = output<void>();

  getProductUrl(): string {
    return `/productos/${this.item().product.slug}`;
  }

  onBrandClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const brandSlug = this.item().product.brand?.slug;
    if (brandSlug) {
      this.router.navigate(['/productos'], { queryParams: { brand: brandSlug } });
    }
  }

  onCategoryClick(event: Event, categorySlug: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/productos'], { queryParams: { category: categorySlug } });
  }

  decrement(): void {
    const qty = this.item().quantity;
    if (qty > 1) {
      this.quantityChange.emit(qty - 1);
    }
  }

  increment(): void {
    this.quantityChange.emit(this.item().quantity + 1);
  }

  onRemove(): void {
    this.remove.emit();
  }
}

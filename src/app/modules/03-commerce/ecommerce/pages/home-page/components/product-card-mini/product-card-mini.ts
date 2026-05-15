import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Datum } from '../../../../pages/products-page/interfaces/products-response.interface';
import { ProductImagePipe } from '../../../../pipes/product-image.pipe';

@Component({
  selector: 'app-product-card-mini',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card-mini.html',
  styleUrl: './product-card-mini.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardMini {
  product = input.required<Datum>();
  addToCart = output<string>();

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product().id);
  }

  getProductUrl(): string {
    return `/productos/${this.product().slug}`;
  }
}

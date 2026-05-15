import { CommonModule } from '@angular/common';
import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Datum } from '../../pages/products-page/interfaces/products-response.interface';
import { ProductImagePipe } from '../../pipes/product-image.pipe';

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  private router = inject(Router);

  product = input.required<Datum>();
  favoriteToggle = output<string>();
  addToCart = output<string>();

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.product().id);
  }

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product().id);
  }

  onBrandClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const brandSlug = this.product().brand?.slug;
    if (brandSlug) {
      this.router.navigate(['/productos'], { queryParams: { brand: brandSlug } });
    }
  }

  onCategoryClick(event: Event, categorySlug: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/productos'], { queryParams: { category: categorySlug } });
  }

  getProductUrl(): string {
    return `/productos/${this.product().slug}`;
  }
}

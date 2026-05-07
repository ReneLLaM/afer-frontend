import { CommonModule } from '@angular/common';
import { Component, input, output, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Datum } from '../../pages/products/interfaces/products-response.interface';
import { ProductImagePipe } from '../../pipes/product-image.pipe';

@Component({
  selector: 'product-card',
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  private router = inject(Router);

  // Inputs usando signals
  product = input.required<Datum>();

  // Outputs usando signals
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
    if (this.product().brand?.slug) {
      this.router.navigate(['/productos'], { queryParams: { brand: this.product().brand.slug } });
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

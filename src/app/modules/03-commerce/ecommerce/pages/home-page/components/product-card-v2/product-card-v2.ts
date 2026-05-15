import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Datum } from '../../../../pages/products-page/interfaces/products-response.interface';
import { ProductImagePipe } from '../../../../pipes/product-image.pipe';

@Component({
  selector: 'app-product-card-v2',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card-v2.html',
  styleUrl: './product-card-v2.scss',
})
export class ProductCardV2 {
  private router = inject(Router);

  product = input.required<Datum>();
  addToCart = output<string>();
  favoriteToggle = output<string>();

  onAddToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product().id);
  }

  onFavoriteClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.product().id);
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
}

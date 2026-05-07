import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductsService } from '../../services/products.service';
import { ProductCard } from '../../components/product-card/product-card';
import { SkeletonCard } from '../../../../../shared/components/skeleton-card/skeleton-card';
import { Datum } from './interfaces/products-response.interface';

@Component({
  selector: 'app-products',
  imports: [ProductCard, SkeletonCard],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  productsService = inject(ProductsService);

  productsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.productsService.getProducts({
        limit: 2,
      });
    },
  });

  products = computed(() => this.productsResource.value()?.data ?? []);
  isLoading = computed(() => this.productsResource.isLoading());

  handleFavorite(productId: string): void {
    console.log('Toggle favorite:', productId);
    // Tu lógica aquí
  }

  handleAddToCart(productId: string): void {
    console.log('Add to cart:', productId);
    // Tu lógica aquí
  }
}

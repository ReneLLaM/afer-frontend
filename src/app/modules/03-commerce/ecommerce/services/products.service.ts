import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProductsResponse } from '../pages/products-page/interfaces/products-response.interface';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductResponse } from '../pages/products-page/interfaces/product-response.interface';

const baseUrl = environment.baseUrl;

enum SortByProductsPublic {
  title = 'title',
  price = 'price',
  brand = 'brand',
  category = 'category',
}

interface Options {
  limit?: number;
  offset?: number;
  categoryId?: string;
  brandId?: string;
  // isFeatured?: boolean;
  // isTrending?: boolean;
  // isNew?: boolean;
  order?: 'ASC' | 'DESC';
  sortBy?: SortByProductsPublic;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  // --- CACHÉ INTELIGENTE ---
  private cache = new Map<string, { data: ProductsResponse, timestamp: number }>();

  getProducts(options: Options): Observable<ProductsResponse> {
    const cacheKey = JSON.stringify(options);
    const ahora = Date.now();
    const CINCO_MINUTOS = 5 * 60 * 1000;

    // 1. Buscamos en el caché
    const guardado = this.cache.get(cacheKey);

    // 2. Si existe Y no han pasado más de 5 minutos, lo devolvemos
    if (guardado && (ahora - guardado.timestamp < CINCO_MINUTOS)) {
      console.log('📦 Products: Cargando desde CACHÉ (Vigente)');
      return of(guardado.data);
    }

    // 3. Si no existe o ya caducó, pedimos al servidor
    console.log('🌐 Products: Pidiendo al SERVIDOR (Caché vacío o caducado)');

    const {
      limit = 10,
      offset = 0,
      categoryId,
      brandId,
      order = 'ASC',
      sortBy = 'title',
    } = options;

    let params: Record<string, string | number> = {
      limit,
      offset,
      order,
      sortBy,
    };

    if (categoryId) params['categoryId'] = categoryId;
    if (brandId) params['brandId'] = brandId;

    return this.http
      .get<ProductsResponse>(`${baseUrl}/products/public`, { params })
      .pipe(
        tap((response) => {
          console.log('✅ Products: Guardado en caché (Vence en 5 min)');
          this.cache.set(cacheKey, { data: response, timestamp: ahora });
        })
      );
  }

  getProductById(slugOrId: string): Observable<ProductResponse> {
    return this.http
      .get<ProductResponse>(`${baseUrl}/products/public/${slugOrId}`)
      .pipe(tap((response) => console.log(response)));
  }
}

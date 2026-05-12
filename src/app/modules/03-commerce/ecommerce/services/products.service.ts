import { HttpClient, HttpParams } from '@angular/common/http';
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
  categoryIds?: string[];
  brandIds?: string[];
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
      categoryIds,
      brandIds,
      order = 'ASC',
      sortBy = 'title',
    } = options;

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('order', order)
      .set('sortBy', sortBy);

    if (categoryIds && categoryIds.length > 0) {
      categoryIds.forEach(id => {
        params = params.append('categoryIds', id);
      });
    }
    if (brandIds && brandIds.length > 0) {
      brandIds.forEach(id => {
        params = params.append('brandIds', id);
      });
    }

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

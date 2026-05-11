import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProductsResponse } from '../pages/products-page/interfaces/products-response.interface';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BrandsResponse } from '../pages/brands-page/interfaces/brands-response.interface';

const baseUrl = environment.baseUrl;

export enum SortByBrandsPublic {
  name = 'name',
  slug = 'slug',
  order = 'order',
  isFeatured = 'isFeatured',
}

interface Options {
  limit?: number;
  offset?: number;
  order?: 'ASC' | 'DESC';
  sortBy?: SortByBrandsPublic;
  isFeatured?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${baseUrl}/brands/public`;

  // --- CACHÉ INTELIGENTE ---
  // Guardamos los datos y la hora en que se guardaron
  private cache = new Map<string, { data: BrandsResponse; timestamp: number }>();

  getBrands(options: Options): Observable<BrandsResponse> {
    const cacheKey = JSON.stringify(options);
    const ahora = Date.now();
    const CINCO_MINUTOS = 5 * 60 * 1000;

    // 1. Buscamos en el caché
    const guardado = this.cache.get(cacheKey);

    // 2. Si existe Y no han pasado más de 5 minutos, lo devolvemos
    if (guardado && ahora - guardado.timestamp < CINCO_MINUTOS) {
      console.log('📦 Brands: Cargando desde CACHÉ (Vigente)');
      return of(guardado.data);
    }

    // 3. Si no existe o ya caducó, pedimos al servidor
    console.log('🌐 Brands: Pidiendo al SERVIDOR (Caché vacío o caducado)');

    const { limit = 10, offset = 0, order = 'ASC', sortBy = 'order', isFeatured } = options;
    let httpParams = new HttpParams();
    httpParams = httpParams.set('limit', limit.toString());
    httpParams = httpParams.set('offset', offset.toString());
    httpParams = httpParams.set('order', order);
    httpParams = httpParams.set('sortBy', sortBy);

    if (isFeatured !== undefined) {
      httpParams = httpParams.set('isFeatured', isFeatured.toString());
    }

    return this.http.get<BrandsResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap((response) => {
        console.log('✅ Brands: Guardado en caché (Vence en 5 min)');
        this.cache.set(cacheKey, { data: response, timestamp: ahora });
      }),
    );
  }
}

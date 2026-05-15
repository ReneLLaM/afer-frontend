import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ProductsResponse } from '../pages/products-page/interfaces/products-response.interface';
import { ProductResponse } from '../pages/products-page/interfaces/product-response.interface';
import { CategoriesResponse } from '../pages/categories-page/interfaces/categories-response.interface';
import { BrandsResponse } from '../pages/brands-page/interfaces/brands-response.interface';
import { environment } from '../../../../../environments/environment';

const baseUrl = environment.baseUrl;

export enum SortByProductsPublic {
  title = 'title',
  price = 'price',
  brand = 'brand',
  category = 'category',
}

export interface ProductsQuery {
  limit?: number;
  offset?: number;
  categories?: string[];
  brands?: string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  order?: 'ASC' | 'DESC';
  sortBy?: SortByProductsPublic;
  search?: string;
  productIds?: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private cache = new Map<string, { data: ProductsResponse; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  getProducts(options: ProductsQuery): Observable<ProductsResponse> {
    const cacheKey = JSON.stringify(options);
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && (now - cached.timestamp < this.TTL)) {
      return of(cached.data);
    }

    const {
      limit = 10,
      offset = 0,
      categories,
      brands,
      isFeatured,
      isTrending,
      isNew,
      search,
      productIds,
    } = options;

    const order = options.order || 'ASC';
    const sortBy = options.sortBy || SortByProductsPublic.title;

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('order', order)
      .set('sortBy', sortBy);

    if (search) params = params.set('search', search);
    if (isFeatured !== undefined) params = params.set('isFeatured', isFeatured.toString());
    if (isTrending !== undefined) params = params.set('isTrending', isTrending.toString());
    if (isNew !== undefined) params = params.set('isNew', isNew.toString());

    if (categories && categories.length > 0) {
      categories.forEach(slug => { params = params.append('categories', slug); });
    }
    if (brands && brands.length > 0) {
      brands.forEach(slug => { params = params.append('brands', slug); });
    }
    if (productIds && productIds.length > 0) {
      productIds.forEach(id => { params = params.append('productIds', id); });
    }

    return this.http
      .get<ProductsResponse>(`${baseUrl}/products/public`, { params })
      .pipe(
        tap(response => this.cache.set(cacheKey, { data: response, timestamp: now }))
      );
  }

  getProductBySlug(slug: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${baseUrl}/products/public/${slug}`);
  }

  getTreeCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${baseUrl}/categories/tree`);
  }

  getBrands(): Observable<BrandsResponse> {
    return this.http.get<BrandsResponse>(`${baseUrl}/brands/public`);
  }

  getBrandsByCategories(categories: string[], search?: string): Observable<BrandsResponse> {
    let params = new HttpParams();
    if (categories && categories.length > 0) {
      categories.forEach(slug => { params = params.append('categories', slug); });
    }
    if (search) params = params.set('search', search);
    return this.http.get<BrandsResponse>(`${baseUrl}/brands/categories-public`, { params });
  }

  invalidateCache(): void {
    this.cache.clear();
  }
}

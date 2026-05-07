import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProductsResponse } from '../pages/products/interfaces/products-response.interface';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const baseUrl = environment.baseUrl;

enum SortByProductsPublic {
  title = 'title',
  price = 'price',
  brand = 'brand',
  category = 'category',
}

interface Options{
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
  private http = inject(HttpClient);

  getProducts(options: Options): Observable<ProductsResponse> {

    const {limit = 10, offset = 0, categoryId, brandId, order = 'ASC', sortBy = 'title'} = options;

    let params: Record<string, string | number> = {
      limit,
      offset,
      order,
      sortBy
    };

    if (categoryId) params['categoryId'] = categoryId;
    if (brandId) params['brandId'] = brandId;

    return this.http.get<ProductsResponse>(`${baseUrl}/products/public`, { params }).pipe(
      tap(response => console.log(response))
    );
  }
}

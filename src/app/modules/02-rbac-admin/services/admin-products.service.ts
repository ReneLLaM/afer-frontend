import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminProductDetail,
  AdminProductsQuery,
  AdminProductsResponse,
  CreateAdminProductDto,
  ReorderAdminProductImagesDto,
  ReorderAdminProductSpecificationsDto,
  ReorderAdminProductVideosDto,
  UpdateAdminProductDto,
} from '../interfaces/admin-product.interface';

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/products`;

  findAll(params: AdminProductsQuery): Observable<AdminProductsResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.brandId) httpParams = httpParams.set('brandId', params.brandId);
    if (params.showDeleted !== undefined) {
      httpParams = httpParams.set('showDeleted', String(params.showDeleted));
    }
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);

    return this.http.get<AdminProductsResponse>(this.endpoint, { params: httpParams });
  }

  findOne(term: string): Observable<AdminProductDetail> {
    return this.http.get<AdminProductDetail>(`${this.endpoint}/${term}`);
  }

  create(
    payload: CreateAdminProductDto,
    imageFiles: readonly File[] = [],
  ): Observable<AdminProductDetail> {
    return this.http.post<AdminProductDetail>(
      this.endpoint,
      this.buildFormData(payload, imageFiles),
    );
  }

  update(
    id: string,
    payload: UpdateAdminProductDto,
    imageFiles: readonly File[] = [],
  ): Observable<AdminProductDetail> {
    return this.http.patch<AdminProductDetail>(
      `${this.endpoint}/${id}`,
      this.buildFormData(payload, imageFiles),
    );
  }

  delete(id: string): Observable<AdminProductDetail> {
    return this.http.delete<AdminProductDetail>(`${this.endpoint}/${id}`);
  }

  reorderImages(
    id: string,
    payload: ReorderAdminProductImagesDto,
  ): Observable<AdminProductDetail> {
    return this.http.patch<AdminProductDetail>(`${this.endpoint}/${id}/reorder-images`, payload);
  }

  reorderVideos(
    id: string,
    payload: ReorderAdminProductVideosDto,
  ): Observable<AdminProductDetail> {
    return this.http.patch<AdminProductDetail>(`${this.endpoint}/${id}/reorder-videos`, payload);
  }

  reorderSpecifications(
    id: string,
    payload: ReorderAdminProductSpecificationsDto,
  ): Observable<AdminProductDetail> {
    return this.http.patch<AdminProductDetail>(
      `${this.endpoint}/${id}/reorder-specifications`,
      payload,
    );
  }

  private buildFormData(
    payload: CreateAdminProductDto | UpdateAdminProductDto,
    imageFiles: readonly File[],
  ): FormData {
    const formData = new FormData();

    for (const imageFile of imageFiles) {
      formData.append('imageFiles', imageFile);
    }

    this.appendText(formData, 'title', payload.title);
    this.appendText(formData, 'sku', payload.sku);
    this.appendText(formData, 'slug', payload.slug);
    this.appendText(formData, 'price', payload.price);
    this.appendBoolean(formData, 'isFeatured', payload.isFeatured);
    this.appendBoolean(formData, 'isTrending', payload.isTrending);
    this.appendBoolean(formData, 'isNew', payload.isNew);
    this.appendText(formData, 'specificationsSummary', payload.specificationsSummary);
    this.appendText(formData, 'description', payload.description);
    this.appendText(formData, 'features', payload.features);
    this.appendText(formData, 'status', payload.status);
    this.appendNumber(formData, 'minStock', payload.minStock);
    this.appendNumber(formData, 'maxStock', payload.maxStock);
    this.appendNumber(formData, 'currentStock', payload.currentStock);
    this.appendNumber(formData, 'warrantyMonths', payload.warrantyMonths);
    this.appendText(formData, 'warrantyDescription', payload.warrantyDescription);
    this.appendJson(formData, 'images', payload.images);
    this.appendJson(formData, 'specifications', payload.specifications);
    this.appendJson(formData, 'videos', payload.videos);
    this.appendJson(formData, 'categoryIds', payload.categoryIds);
    this.appendText(formData, 'brandId', payload.brandId);

    return formData;
  }

  private appendText(formData: FormData, key: string, value?: string): void {
    if (value !== undefined) {
      formData.append(key, value);
    }
  }

  private appendBoolean(formData: FormData, key: string, value?: boolean): void {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  }

  private appendNumber(formData: FormData, key: string, value?: number): void {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  }

  private appendJson(formData: FormData, key: string, value?: unknown): void {
    if (value !== undefined) {
      formData.append(key, JSON.stringify(value));
    }
  }
}

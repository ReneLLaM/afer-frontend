import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminCategoriesQuery,
  AdminCategoriesResponse,
  AdminCategoriesTreeResponse,
  AdminCategoryDeleteResult,
  AdminCategoryDetail,
  CreateAdminCategoryDto,
  ReorderAdminCategoriesDto,
  UpdateAdminCategoryDto,
} from '../interfaces/admin-category.interface';

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/categories`;

  findAll(params: AdminCategoriesQuery): Observable<AdminCategoriesResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.level !== undefined) httpParams = httpParams.set('level', String(params.level));
    if (params.parentId) httpParams = httpParams.set('parentId', params.parentId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.showDeleted !== undefined) {
      httpParams = httpParams.set('showDeleted', String(params.showDeleted));
    }
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);

    return this.http.get<AdminCategoriesResponse>(this.endpoint, {
      params: httpParams,
    });
  }

  findTree(): Observable<AdminCategoriesTreeResponse> {
    return this.http.get<AdminCategoriesTreeResponse>(`${this.endpoint}/admin-tree`);
  }

  findOne(term: string): Observable<AdminCategoryDetail> {
    return this.http.get<AdminCategoryDetail>(`${this.endpoint}/${term}`);
  }

  create(
    payload: CreateAdminCategoryDto,
    imageFile?: File,
  ): Observable<AdminCategoryDetail> {
    return this.http.post<AdminCategoryDetail>(
      this.endpoint,
      this.buildFormData(payload, imageFile),
    );
  }

  update(
    id: string,
    payload: UpdateAdminCategoryDto,
    imageFile?: File,
  ): Observable<AdminCategoryDetail> {
    return this.http.patch<AdminCategoryDetail>(
      `${this.endpoint}/${id}`,
      this.buildFormData(payload, imageFile),
    );
  }

  reorder(
    payload: ReorderAdminCategoriesDto,
  ): Observable<
    { id: string; name: string; slug: string; image: string | null; imageUrl: string | null; imageKey: string | null; order: number; level: number }[]
  > {
    return this.http.patch<
      { id: string; name: string; slug: string; image: string | null; imageUrl: string | null; imageKey: string | null; order: number; level: number }[]
    >(`${this.endpoint}/reorder`, payload);
  }

  delete(id: string): Observable<AdminCategoryDeleteResult> {
    return this.http.delete<AdminCategoryDeleteResult>(`${this.endpoint}/${id}`);
  }

  private buildFormData(
    payload: CreateAdminCategoryDto | UpdateAdminCategoryDto,
    imageFile?: File,
  ): FormData {
    const formData = new FormData();

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (payload.image !== undefined) {
      formData.append('image', payload.image);
    }

    this.appendText(formData, 'name', payload.name);
    this.appendText(formData, 'slug', payload.slug);
    this.appendText(formData, 'description', payload.description);
    this.appendText(formData, 'status', payload.status);
    this.appendBoolean(formData, 'isFeatured', payload.isFeatured);

    if (payload.parentId !== undefined) {
      formData.append('parentId', payload.parentId ?? '');
    }

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
}

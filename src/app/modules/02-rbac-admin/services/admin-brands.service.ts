import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminBrandDeleteResult,
  AdminBrandDetail,
  AdminBrandsQuery,
  AdminBrandsResponse,
  CreateAdminBrandDto,
  ReorderAdminBrandsDto,
  UpdateAdminBrandDto,
} from '../interfaces/admin-brand.interface';

@Injectable({ providedIn: 'root' })
export class AdminBrandsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/brands`;

  findAll(params: AdminBrandsQuery): Observable<AdminBrandsResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.showDeleted !== undefined) {
      httpParams = httpParams.set('showDeleted', String(params.showDeleted));
    }
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);

    return this.http.get<AdminBrandsResponse>(this.endpoint, { params: httpParams });
  }

  findOne(term: string): Observable<AdminBrandDetail> {
    return this.http.get<AdminBrandDetail>(`${this.endpoint}/${term}`);
  }

  create(payload: CreateAdminBrandDto, imageFile: File): Observable<AdminBrandDetail> {
    return this.http.post<AdminBrandDetail>(this.endpoint, this.buildFormData(payload, imageFile));
  }

  update(id: string, payload: UpdateAdminBrandDto, imageFile?: File): Observable<AdminBrandDetail> {
    return this.http.patch<AdminBrandDetail>(`${this.endpoint}/${id}`, this.buildFormData(payload, imageFile));
  }

  reorder(payload: ReorderAdminBrandsDto): Observable<{ id: string; name: string; slug: string; order: number }[]> {
    return this.http.patch<{ id: string; name: string; slug: string; order: number }[]>(
      `${this.endpoint}/reorder`,
      payload,
    );
  }

  delete(id: string): Observable<AdminBrandDeleteResult> {
    return this.http.delete<AdminBrandDeleteResult>(`${this.endpoint}/${id}`);
  }

  private buildFormData(
    payload: CreateAdminBrandDto | UpdateAdminBrandDto,
    imageFile?: File,
  ): FormData {
    const formData = new FormData();

    if (imageFile) {
      formData.append('image', imageFile);
    }

    this.appendText(formData, 'name', payload.name);
    this.appendText(formData, 'slug', payload.slug);
    this.appendText(formData, 'description', payload.description);
    this.appendBoolean(formData, 'isFeatured', payload.isFeatured);
    this.appendText(formData, 'status', payload.status);
    this.appendText(formData, 'backgroundColor', payload.backgroundColor);

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

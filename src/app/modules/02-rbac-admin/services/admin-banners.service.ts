import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminBannerDeleteResult,
  AdminBannerDetail,
  AdminBannersQuery,
  AdminBannersResponse,
  CreateAdminBannerDto,
  ReorderAdminBannersDto,
  UpdateAdminBannerDto,
} from '../interfaces/admin-banner.interface';

@Injectable({ providedIn: 'root' })
export class AdminBannersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/banners`;

  findAll(params: AdminBannersQuery): Observable<AdminBannersResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', String(params.isActive));
    if (params.showDeleted !== undefined) {
      httpParams = httpParams.set('showDeleted', String(params.showDeleted));
    }
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);

    return this.http.get<AdminBannersResponse>(this.endpoint, {
      params: httpParams,
    });
  }

  findOne(id: string): Observable<AdminBannerDetail> {
    return this.http.get<AdminBannerDetail>(`${this.endpoint}/${id}`);
  }

  create(payload: CreateAdminBannerDto, imageFile: File): Observable<AdminBannerDetail> {
    return this.http.post<AdminBannerDetail>(this.endpoint, this.buildFormData(payload, imageFile));
  }

  update(id: string, payload: UpdateAdminBannerDto, imageFile?: File): Observable<AdminBannerDetail> {
    return this.http.patch<AdminBannerDetail>(`${this.endpoint}/${id}`, this.buildFormData(payload, imageFile));
  }

  reorder(payload: ReorderAdminBannersDto): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.endpoint}/reorder`, payload);
  }

  delete(id: string): Observable<AdminBannerDeleteResult> {
    return this.http.delete<AdminBannerDeleteResult>(`${this.endpoint}/${id}`);
  }

  private buildFormData(
    payload: CreateAdminBannerDto | UpdateAdminBannerDto,
    imageFile?: File,
  ): FormData {
    const formData = new FormData();

    if (imageFile) {
      formData.append('image', imageFile);
    }

    this.appendText(formData, 'title', payload.title);
    this.appendText(formData, 'description', payload.description);
    this.appendText(formData, 'ctaLabel', payload.ctaLabel);
    this.appendBoolean(formData, 'isActive', payload.isActive);
    this.appendText(formData, 'startsAt', payload.startsAt);
    this.appendText(formData, 'endsAt', payload.endsAt);
    this.appendArray(formData, 'categoriesIds', payload.categoriesIds);
    this.appendArray(formData, 'productsIds', payload.productsIds);
    this.appendArray(formData, 'brandsIds', payload.brandsIds);

    return formData;
  }

  private appendText(formData: FormData, key: string, value?: string): void {
    if (value !== undefined) {
      formData.append(key, value);
    }
  }

  private appendNumber(formData: FormData, key: string, value?: number): void {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  }

  private appendBoolean(formData: FormData, key: string, value?: boolean): void {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  }

  private appendArray(formData: FormData, key: string, values?: string[]): void {
    if (values !== undefined) {
      formData.append(key, JSON.stringify(values));
    }
  }
}

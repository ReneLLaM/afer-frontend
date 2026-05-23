import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionsResponse } from '../interfaces/admin-permission.interface';

export interface AdminPermissionsQuery {
  limit?: number;
  offset?: number;
  search?: string;
  module?: string;
  action?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class AdminPermissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  findAll(params: AdminPermissionsQuery): Observable<PermissionsResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.module) httpParams = httpParams.set('module', params.module);
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);

    return this.http.get<PermissionsResponse>(`${this.baseUrl}/permissions`, {
      params: httpParams,
    });
  }

  findOne(term: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.baseUrl}/permissions/${encodeURIComponent(term)}`);
  }

  seed(): Observable<string> {
    return this.http.post(`${this.baseUrl}/permissions/seed`, {}, { responseType: 'text' });
  }
}

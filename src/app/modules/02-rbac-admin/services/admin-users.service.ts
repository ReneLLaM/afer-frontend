import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminUserDeleteResult,
  AdminUserDetail,
  AdminUsersQuery,
  AdminUsersResponse,
  CreateAdminUserDto,
  UpdateAdminUserAccessDto,
  UpdateAdminUserDto,
} from '../interfaces/admin-user.interface';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/users`;

  findAll(params: AdminUsersQuery): Observable<AdminUsersResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.roleId) httpParams = httpParams.set('roleId', params.roleId);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);
    if (params.showDeleted !== undefined) {
      httpParams = httpParams.set('showDeleted', String(params.showDeleted));
    }

    return this.http.get<AdminUsersResponse>(this.endpoint, {
      params: httpParams,
    });
  }

  findOne(id: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.endpoint}/${id}`);
  }

  create(payload: CreateAdminUserDto): Observable<AdminUserDetail> {
    return this.http.post<AdminUserDetail>(this.endpoint, payload);
  }

  update(id: string, payload: UpdateAdminUserDto): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.endpoint}/${id}`, payload);
  }

  updateAccess(id: string, payload: UpdateAdminUserAccessDto): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.endpoint}/${id}/access`, payload);
  }

  delete(id: string): Observable<AdminUserDeleteResult> {
    return this.http.delete<AdminUserDeleteResult>(`${this.endpoint}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminRoleDeleteResult,
  AdminRoleDetail,
  AdminRolesQuery,
  AdminRolesResponse,
  CreateAdminRoleDto,
  UpdateAdminRoleDto,
} from '../interfaces/admin-role.interface';

@Injectable({ providedIn: 'root' })
export class AdminRolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/roles`;

  findAll(params: AdminRolesQuery): Observable<AdminRolesResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);
    if (params.roleType) {
      httpParams = httpParams.set('roleType', params.roleType);
    }
    if (params.showDeleted !== undefined) {
      httpParams = httpParams.set('showDeleted', String(params.showDeleted));
    }

    return this.http.get<AdminRolesResponse>(this.endpoint, {
      params: httpParams,
    });
  }

  findOne(id: string): Observable<AdminRoleDetail> {
    return this.http.get<AdminRoleDetail>(`${this.endpoint}/${id}`);
  }

  create(payload: CreateAdminRoleDto): Observable<AdminRoleDetail> {
    return this.http.post<AdminRoleDetail>(this.endpoint, payload);
  }

  update(id: string, payload: UpdateAdminRoleDto): Observable<AdminRoleDetail> {
    return this.http.patch<AdminRoleDetail>(`${this.endpoint}/${id}`, payload);
  }

  seed(): Observable<string> {
    return this.http.post(`${this.endpoint}/seed`, {}, { responseType: 'text' });
  }

  delete(id: string): Observable<AdminRoleDeleteResult> {
    return this.http.delete<AdminRoleDeleteResult>(`${this.endpoint}/${id}`);
  }
}

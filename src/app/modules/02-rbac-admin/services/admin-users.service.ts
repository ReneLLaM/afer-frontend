import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UsersResponse } from '../interfaces/admin-user.interface';

export interface AdminUsersQuery {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  findAll(params: AdminUsersQuery): Observable<UsersResponse> {
    let httpParams = new HttpParams();

    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined) httpParams = httpParams.set('offset', String(params.offset));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);

    return this.http.get<UsersResponse>(`${this.baseUrl}/users`, {
      params: httpParams,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}

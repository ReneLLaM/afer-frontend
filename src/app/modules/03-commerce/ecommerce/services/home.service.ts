import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BannerResponse } from '../pages/home-page/interfaces/banner-response.interface';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  isFeatured: boolean;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  private banners$?: Observable<BannerResponse[]>;

  getPublicBanners(): Observable<BannerResponse[]> {
    if (!this.banners$) {
      this.banners$ = this.http.get<BannerResponse[]>(`${this.baseUrl}/banners/public`).pipe(
        shareReplay(1)
      );
    }
    return this.banners$;
  }

  getFeaturedCategories(): Observable<FeaturedCategory[]> {
    return this.http.get<FeaturedCategory[]>(`${this.baseUrl}/categories/feactured-public`);
  }
}

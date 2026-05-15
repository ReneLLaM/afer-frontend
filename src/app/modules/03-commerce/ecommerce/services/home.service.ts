import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { BannerResponse } from '../pages/home-page/interfaces/banner-response.interface';
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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  private banners$?: Observable<BannerResponse[]>;
  private featuredCategories$?: Observable<FeaturedCategory[]>;

  getPublicBanners(): Observable<BannerResponse[]> {
    if (!this.banners$) {
      this.banners$ = this.http.get<BannerResponse[]>(`${this.baseUrl}/banners/public`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.banners$;
  }

  getFeaturedCategories(): Observable<FeaturedCategory[]> {
    if (!this.featuredCategories$) {
      this.featuredCategories$ = this.http.get<FeaturedCategory[]>(`${this.baseUrl}/categories/feactured-public`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.featuredCategories$;
  }
}

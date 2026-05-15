import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrandsService, SortByBrandsPublic } from '../../../../services/brands.service';
import { BrandCard } from '../../../../components/brand-card/brand-card';
import { catchError, of } from 'rxjs';
import { Datum as BrandDatum, BrandsResponse } from '../../../brands-page/interfaces/brands-response.interface';

const EMPTY_RESPONSE: BrandsResponse = { data: [], meta: { total: 0, limit: 0, offset: 0, page: 0, totalPages: 0 } };

@Component({
  selector: 'app-brand-section',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandCard],
  templateUrl: './brand-section.html',
  styleUrl: './brand-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandSection {
  private brandsService = inject(BrandsService);
  private destroyRef = inject(DestroyRef);

  brands = signal<BrandDatum[]>([]);
  isLoading = signal(true);

  constructor() {
    this.loadBrands();
  }

  private loadBrands(): void {
    this.isLoading.set(true);

    this.brandsService
      .getBrands({
        limit: 12,
        isFeatured: true,
        order: 'ASC',
        sortBy: SortByBrandsPublic.order,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(EMPTY_RESPONSE))
      )
      .subscribe((response) => {
        this.brands.set(response.data.filter((b) => b.image));
        this.isLoading.set(false);
      });
  }
}

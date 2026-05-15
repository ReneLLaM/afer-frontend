import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandsService } from '../../../../services/brands.service';
import { BrandCard } from '../../../../components/brand-card/brand-card';
import { RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-brand-section',
  standalone: true,
  imports: [CommonModule, BrandCard, RouterLink],
  templateUrl: './brand-section.html',
  styleUrl: './brand-section.scss',
})
export class BrandSection implements OnInit {
  private brandsService = inject(BrandsService);

  brands = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadBrands();
  }

  private loadBrands() {
    this.isLoading.set(true);
    this.brandsService.getBrands({ 
      limit: 12,
      isFeatured: true // Solo marcas destacadas para la home
    }).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(() => {
        this.isLoading.set(false);
        return of({ data: [] });
      })
    ).subscribe(response => {
      // Filtrar marcas que tengan imagen para mostrar en la home
      this.brands.set(response.data.filter((b: any) => b.imageUrl || b.image));
    });
  }
}

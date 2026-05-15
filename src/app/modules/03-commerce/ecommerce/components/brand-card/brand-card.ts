import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Datum as Brand } from '../../pages/brands-page/interfaces/brands-response.interface';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './brand-card.html',
  styleUrl: './brand-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandCard {
  brand = input.required<Brand>();

  getBrandUrl(): string {
    return '/productos';
  }

  getBrandParams(): { brand: string; page: number } {
    return {
      brand: this.brand().slug,
      page: 1,
    };
  }
}

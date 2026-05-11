import { Component, input } from '@angular/core';
import { Datum as Brand } from '../../pages/brands-page/interfaces/brands-response.interface';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-card',
  imports: [RouterLink, CommonModule],
  templateUrl: './brand-card.html',
  styleUrl: './brand-card.scss',
})
export class BrandCard {
  brand = input.required<Brand>();

  getBrandUrl() {
    return `/commerce/products?brandId=${this.brand().id}`;
  }
}

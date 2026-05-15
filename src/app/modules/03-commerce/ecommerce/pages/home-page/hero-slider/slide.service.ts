import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Slide } from './slide.model';

@Injectable({ providedIn: 'root' })
export class SliderService {

  private mockSlides: Slide[] = [
    {
      id: '1',
      title: 'Platos perfectos, cocinados con pasión',
      description: 'Cocina encimera',
      image: 'assets/slides/bosch-cocina.jpg',
      ctaLabel: 'Ver Productos',
      ctaLink: '/productos',
      queryParams: { isFeatured: 'true' },
    },
    {
      id: '2',
      title: 'Comida más saludable y deliciosa',
      description: 'Freidora de aire',
      image: 'assets/slides/oster-freidora.jpg',
      ctaLabel: 'Ver Productos',
      ctaLink: '/productos',
      queryParams: { isTrending: 'true' },
    },
    {
      id: '3',
      title: 'Lava más rápido y ahorra energía',
      description: 'Lavadora automática',
      image: 'assets/slides/bosch-cocina.jpg',
      ctaLabel: 'Ver Productos',
      ctaLink: '/productos',
      queryParams: { isNew: 'true' },
    },
    {
      id: '4',
      title: 'Frío perfecto para toda la familia',
      description: 'Refrigerador inverter',
      image: 'assets/slides/oster-freidora.jpg',
      ctaLabel: 'Ver Productos',
      ctaLink: '/productos',
      queryParams: { isFeatured: 'true' },
    },
    {
      id: '5',
      title: 'Cocina más sostenible y eficiente',
      description: 'Cocina eléctrica',
      image: 'assets/slides/bosch-cocina.jpg',
      ctaLabel: 'Ver Productos',
      ctaLink: '/productos',
      queryParams: { isTrending: 'true' },
    }
  ];

  getSlides(): Observable<Slide[]> {
    return of(this.mockSlides);
  }
}

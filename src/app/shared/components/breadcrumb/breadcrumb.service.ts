import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  // Mapa reactivo que asocia una URL (ej. '/productos/slug') con un nombre ('Silla Gamer Xtreme')
  dynamicLabels = signal<Record<string, string>>({});

  setDynamicLabel(url: string, label: string) {
    this.dynamicLabels.update(labels => ({
      ...labels,
      [url]: label
    }));
  }
}

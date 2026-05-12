import { Component, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CategoriesService } from '../../services/categories.service';
import { CategoryTreeNodeComponent } from '../../components/category-tree-node/category-tree-node.component';
import { CommonModule } from '@angular/common';
import { CategoriesResponse, Datum } from './interfaces/categories-response.interface';

@Component({
  selector: 'categories-page',
  standalone: true,
  imports: [CommonModule, CategoryTreeNodeComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss'
})
export class CategoriesPage {
  private readonly categoriesService = inject(CategoriesService);

  // En rxResource se usa 'stream' para Observables, no 'loader'
  readonly categoriesResource = rxResource<CategoriesResponse, unknown>({
    stream: () => this.categoriesService.getTree(),
  });

  // Filtrado recursivo para mostrar solo categorías activas
  readonly categories = computed(() => {
    const rawData = this.categoriesResource.value()?.data ?? [];
    return this.filterActiveNodes(rawData);
  });

  readonly isLoading = computed(() => this.categoriesResource.isLoading());
  readonly hasError = computed(() => !!this.categoriesResource.error());

  /**
   * Filtra recursivamente los nodos para que solo aparezcan los 'active'
   */
  private filterActiveNodes(nodes: Datum[]): Datum[] {
    return nodes
      .filter(node => node.status === 'active')
      .map(node => ({
        ...node,
        children: this.filterActiveNodes(node.children || [])
      }));
  }
}

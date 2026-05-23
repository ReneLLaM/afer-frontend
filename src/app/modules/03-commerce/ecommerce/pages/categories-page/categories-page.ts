import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CategoriesService } from '../../services/categories.service';
import { CategoryTreeNode } from '../../components/category-tree-node/category-tree-node.component';
import { CommonModule } from '@angular/common';
import { CategoriesResponse, Datum } from './interfaces/categories-response.interface';

@Component({
  selector: 'categories-page',
  standalone: true,
  imports: [CommonModule, CategoryTreeNode],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  private readonly categoriesService = inject(CategoriesService);

  readonly categoriesResource = rxResource<CategoriesResponse, void>({
    stream: () => this.categoriesService.getTree(),
  });

  readonly categories = computed((): Datum[] => {
    const rawData = this.categoriesResource.value()?.data ?? [];
    return this.filterActiveNodes(rawData);
  });

  readonly isLoading = computed(() => this.categoriesResource.isLoading());
  readonly hasError = computed(() => !!this.categoriesResource.error());

  private filterActiveNodes(nodes: Datum[]): Datum[] {
    return nodes
      .filter(node => node.status === 'active')
      .map(node => ({
        ...node,
        children: this.filterActiveNodes(node.children || []),
      }));
  }
}

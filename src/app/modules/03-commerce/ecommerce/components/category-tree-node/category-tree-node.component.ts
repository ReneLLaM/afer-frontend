import { Component, input, signal, HostBinding, forwardRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Datum } from '../../pages/categories-page/interfaces/categories-response.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-tree-node',
  standalone: true,
  imports: [CommonModule, forwardRef(() => CategoryTreeNode)],
  templateUrl: './category-tree-node.component.html',
  styleUrl: './category-tree-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTreeNode {
  private readonly router = inject(Router);
  node = input.required<Datum>();
  level = input<number>(0);

  @HostBinding('attr.data-level') get dataLevel(): number {
    return this.level();
  }

  isExpanded = signal<boolean>(false);

  get hasChildren(): boolean {
    const n = this.node();
    return !!(n && n.children && n.children.length > 0);
  }

  toggle(event?: Event): void {
    if (!this.hasChildren) return;
    event?.stopPropagation();
    this.isExpanded.update(v => !v);
  }

  viewProducts(event: Event): void {
    event.stopPropagation();
    const node = this.node();
    const allSlugs = this.getAllCategorySlugs(node);
    this.router.navigate(['/productos'], {
      queryParams: { category: allSlugs.join(','), page: 1 }
    });
  }

  private getAllCategorySlugs(node: Datum): string[] {
    let slugs = [node.slug];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        slugs = [...slugs, ...this.getAllCategorySlugs(child)];
      });
    }
    return slugs;
  }

  trackBySlug(_index: number, item: Datum): string {
    return item.slug;
  }
}

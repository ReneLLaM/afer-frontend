import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Datum } from '../../pages/categories-page/interfaces/categories-response.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-tree-node',
  standalone: true,
  imports: [CommonModule, MatIconModule, forwardRef(() => CategoryTreeNode)],
  templateUrl: './category-tree-node.component.html',
  styleUrl: './category-tree-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTreeNode {
  private readonly router = inject(Router);
  node = input.required<Datum>();
  level = input<number>(0);
  selectedNodeId = input<string | null>(null);
  showProductsAction = input<boolean>(true);
  showMeta = input<boolean>(false);
  actionLabel = input<string>('Ver productos');
  showAdminActions = input<boolean>(false);
  emphasizeSelectedNode = input<boolean>(false);
  nodeSelected = output<Datum>();
  viewRequested = output<Datum>();
  editRequested = output<Datum>();
  deleteRequested = output<Datum>();

  @HostBinding('attr.data-level') get dataLevel(): number {
    return this.level();
  }

  isExpanded = signal<boolean>(false);

  constructor() {
    effect(() => {
      const selectedNodeId = this.selectedNodeId();
      const node = this.node();

      if (!selectedNodeId || !node.children?.length) return;

      if (this.hasSelectedDescendant(node, selectedNodeId)) {
        this.isExpanded.set(true);
      }
    });
  }

  get hasChildren(): boolean {
    const n = this.node();
    return !!(n && n.children && n.children.length > 0);
  }

  get isSelected(): boolean {
    return this.selectedNodeId() === this.node().id;
  }

  get isCurrentLocation(): boolean {
    return this.emphasizeSelectedNode() && this.isSelected;
  }

  toggle(event?: Event): void {
    if (!this.hasChildren) return;
    event?.stopPropagation();
    this.isExpanded.update((v) => !v);
  }

  onNodeClick(event?: Event): void {
    if (this.hasChildren) {
      this.toggle(event);
    }

    this.nodeSelected.emit(this.node());
  }

  viewProducts(event: Event): void {
    event.stopPropagation();
    const node = this.node();
    const allSlugs = this.getAllCategorySlugs(node);
    this.router.navigate(['/productos'], {
      queryParams: { category: allSlugs.join(','), page: 1 },
    });
  }

  requestView(event: Event): void {
    event.stopPropagation();
    this.viewRequested.emit(this.node());
  }

  requestEdit(event: Event): void {
    event.stopPropagation();
    this.editRequested.emit(this.node());
  }

  requestDelete(event: Event): void {
    event.stopPropagation();
    this.deleteRequested.emit(this.node());
  }

  private getAllCategorySlugs(node: Datum): string[] {
    let slugs = [node.slug];
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        slugs = [...slugs, ...this.getAllCategorySlugs(child)];
      });
    }
    return slugs;
  }

  private hasSelectedDescendant(node: Datum, selectedNodeId: string): boolean {
    return (node.children ?? []).some(
      (child) => child.id === selectedNodeId || this.hasSelectedDescendant(child, selectedNodeId),
    );
  }

  trackBySlug(_index: number, item: Datum): string {
    return item.slug;
  }
}

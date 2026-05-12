import { Component, input, signal, HostBinding, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Datum } from '../../pages/categories-page/interfaces/categories-response.interface';

@Component({
  selector: 'app-category-tree-node',
  standalone: true,
  imports: [CommonModule, forwardRef(() => CategoryTreeNodeComponent)],
  templateUrl: './category-tree-node.component.html',
  styleUrl: './category-tree-node.component.scss',
})
export class CategoryTreeNodeComponent {
  node = input.required<Datum>();
  level = input<number>(0);

  @HostBinding('attr.data-level') get dataLevel() {
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

  trackById(_index: number, item: Datum): string {
    return item.id;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ── Data model ────────────────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

export type CheckState = 'checked' | 'indeterminate' | 'unchecked';

export interface FlatItem {
  id: string;
  label: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  checkState: CheckState;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'tree-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './tree-filter.html',
  styleUrl: './tree-filter.scss',
})
export class TreeFilterComponent {
  // ── Inputs / Outputs ────────────────────────────────────────────────────────

  data = input<TreeNode[]>([]);
  title = input<string>('Categorías');
  selectedIdsInput = input<string[]>([], { alias: 'selectedIds' });
  selectionChange = output<string[]>();

  // ── Reactive state ──────────────────────────────────────────────────────────

  filterText    = signal('');
  expandedIds   = signal<Set<string>>(new Set());
  checkedLeafIds = signal<Set<string>>(new Set());

  constructor() {
    // Sincronizar input externo con estado interno
    effect(() => {
      const external = this.selectedIdsInput();
      this.checkedLeafIds.set(new Set(external));
    }, { allowSignalWrites: true });
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  selectedCount = computed(() => this.checkedLeafIds().size);

  visibleItems = computed((): FlatItem[] => {
    const query = this.filterText().toLowerCase().trim();
    const items: FlatItem[] = [];
    this.buildFlatList(this.data(), 0, query, items);
    return items;
  });

  // ── Template helpers ────────────────────────────────────────────────────────

  trackById(_: number, item: FlatItem): string {
    return item.id;
  }

  clearFilter(): void {
    this.filterText.set('');
  }

  // ── Interactions ────────────────────────────────────────────────────────────

  toggleExpand(id: string): void {
    this.expandedIds.update(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleCheck(id: string): void {
    const node = this.findNode(this.data(), id);
    if (!node) return;

    const leafIds     = this.getAllLeafIds(node);
    const checkState  = this.computeCheckState(node);

    this.checkedLeafIds.update(prev => {
      const next = new Set(prev);
      if (checkState === 'checked') {
        leafIds.forEach(lid => next.delete(lid));
      } else {
        leafIds.forEach(lid => next.add(lid));
      }
      
      // Emit selection change
      this.selectionChange.emit(Array.from(next));
      
      return next;
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Builds the flat, visible list of tree items.
   */
  private buildFlatList(
    nodes: TreeNode[],
    depth: number,
    query: string,
    items: FlatItem[],
  ): boolean {
    let anyAdded = false;

    for (const node of nodes) {
      const hasChildren = !!node.children?.length;

      if (!query) {
        // ── no filter: normal expand/collapse ──────────────────────────────
        const isExpanded = this.expandedIds().has(node.id);
        items.push(this.makeFlatItem(node, depth, isExpanded));
        if (isExpanded && node.children) {
          this.buildFlatList(node.children, depth + 1, '', items);
        }
        anyAdded = true;

      } else {
        // ── active filter ──────────────────────────────────────────────────
        const labelMatch = node.name.toLowerCase().includes(query);

        if (labelMatch) {
          // Node itself matches → show expanded with ALL children visible
          items.push(this.makeFlatItem(node, depth, hasChildren));
          if (hasChildren) {
            this.buildFlatList(node.children!, depth + 1, '', items); // no filter on children
          }
          anyAdded = true;

        } else if (hasChildren) {
          // Check if any descendant matches
          const childItems: FlatItem[] = [];
          const childAdded = this.buildFlatList(node.children!, depth + 1, query, childItems);
          if (childAdded) {
            items.push(this.makeFlatItem(node, depth, true)); // force expanded
            items.push(...childItems);
            anyAdded = true;
          }
        }
      }
    }

    return anyAdded;
  }

  private makeFlatItem(node: TreeNode, depth: number, isExpanded: boolean): FlatItem {
    return {
      id:          node.id,
      label:       node.name,
      depth:       depth,
      hasChildren: !!node.children?.length,
      isExpanded:  isExpanded,
      checkState:  this.computeCheckState(node),
    };
  }

  private computeCheckState(node: TreeNode): CheckState {
    const leafIds = this.getAllLeafIds(node);
    const checked = leafIds.filter(id => this.checkedLeafIds().has(id));

    if (checked.length === 0) return 'unchecked';
    if (checked.length === leafIds.length) return 'checked';
    return 'indeterminate';
  }

  private getAllLeafIds(node: TreeNode): string[] {
    if (!node.children?.length) return [node.id];
    return node.children.flatMap(c => this.getAllLeafIds(c));
  }

  private findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = this.findNode(n.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }
}
import {
  Component,
  computed,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  TemplateRef,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { ListMeta } from '../../models/list-meta.model';
import { AuthStore } from '../../../modules/01-identity/auth/store/auth.store';
import {
  buildCrudTableActions,
  type CrudTableActionsConfig,
} from '../../utils/table-actions.utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CellType = 'text' | 'image' | 'badge' | 'boolean' | 'custom';
export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'neutral';
export type SortDirection = 'asc' | 'desc' | null;
export type BreakpointHide = 'sm' | 'md' | 'lg';
export type TableDensity = 'comfortable' | 'compact';
export type TableLayout = 'auto' | 'fixed';

export interface BadgeOption {
  label?: string;
  variant?: BadgeVariant;
}

/** Cualquier objeto con `.transform()` funciona: pipes de Angular o wrappers custom */
export interface TablePipe {
  transform(value: unknown, ...args: unknown[]): unknown;
}

export interface TableColumn<T = unknown> {
  key: string;
  label: string;

  sortable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';

  headerClass?: string;
  cellClass?: string | ((value: unknown, row: T) => string);

  type?: CellType;

  imageSize?: 'sm' | 'md' | 'lg';
  imageRound?: boolean;

  format?: (value: unknown, row: T) => string;
  pipe?: TablePipe;
  pipeArgs?: unknown[];

  badgeMap?: Record<string, BadgeOption>;
  badgeFn?: (value: unknown, row: T) => BadgeOption;

  template?: TemplateRef<{ $implicit: unknown; row: T; col: TableColumn<T> }>;

  /** Permite salto de línea en celdas largas */
  wrap?: boolean;
  /** Truncar con ellipsis (solo si es true; por defecto el texto hace wrap) */
  truncate?: boolean;
  /** Ocultar columna por debajo del breakpoint */
  hideBelow?: BreakpointHide;
  /** Columna fija al hacer scroll horizontal */
  sticky?: 'start' | 'end';
}

/** @deprecated Usar ListMeta desde shared/models/list-meta.model */
export type TableMeta = ListMeta;

export interface TableAction<T = unknown> {
  icon: string;
  label: string;
  class?: string;
  /** Si se define, la tabla oculta el botón sin el permiso (RBAC UI) */
  permission?: string | string[];
  permissionMode?: 'any' | 'all';
  show?: (row: T) => boolean;
  callback: (row: T) => void;
}

export interface SortEvent {
  key: string;
  direction: SortDirection;
}

const IMAGE_KEY_HINTS = new Set([
  'image', 'img', 'logo', 'avatar', 'photo', 'thumbnail', 'picture', 'icon',
]);

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, MatIconModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DataTableComponent<T = any> {
  private readonly authStore = inject(AuthStore);

  columns = input.required<TableColumn<T>[]>();
  data = input.required<T[]>();
  meta = input<ListMeta>();
  /** Acciones manuales (combinadas con `crud`) */
  actions = input<TableAction<T>[]>([]);
  /** Ver / Editar / Eliminar con permisos — la tabla decide qué iconos mostrar */
  crud = input<CrudTableActionsConfig<T> | null>(null);
  loading = input<boolean>(false);
  emptyMessage = input<string>('No se encontraron registros');
  trackByKey = input<keyof T & string>('id' as keyof T & string);

  sortKey = input<string>('');
  sortDir = input<SortDirection>(null);

  /** Si true, no reordena en cliente (sort viene del servidor) */
  serverSort = input<boolean>(true);
  showFooterInfo = input<boolean>(false);
  density = input<TableDensity>('comfortable');
  /** auto = muestra todo el contenido; fixed = anchos fijos (sort estable) */
  layout = input<TableLayout>('auto');
  /** Preparado para CDK drag-drop en marcas */
  reorderable = input<boolean>(false);

  sortChange = output<SortEvent>();
  rowReorder = output<{ fromIndex: number; toIndex: number; row: T }>();

  isLoading = computed(() => this.loading());
  hasData = computed(() => this.data().length > 0);

  resolvedActions = computed((): TableAction<T>[] => {
    const crud = this.crud();
    const built = crud ? buildCrudTableActions(crud) : [];
    return [...built, ...this.actions()];
  });

  hasActionsColumn = computed(() => this.resolvedActions().length > 0);

  displayData = computed(() => {
    if (this.serverSort()) return this.data();

    const key = this.sortKey();
    const dir = this.sortDir();
    const items = this.data();
    if (!dir || !key) return items;

    return [...items].sort((a, b) => {
      const vA = (a as Record<string, unknown>)[key];
      const vB = (b as Record<string, unknown>)[key];
      if (vA == null && vB == null) return 0;
      if (vA == null) return dir === 'asc' ? -1 : 1;
      if (vB == null) return dir === 'asc' ? 1 : -1;
      if (typeof vA === 'string' && typeof vB === 'string')
        return dir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      if (vA < vB) return dir === 'asc' ? -1 : 1;
      if (vA > vB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  visibleColumns = computed(() => this.columns());

  trackRow = (index: number, row: T): unknown => {
    const key = this.trackByKey();
    return key && row[key] != null ? row[key] : index;
  };

  onSort(key: string): void {
    const same = this.sortKey() === key;
    const dir = this.sortDir();
    let newDir: SortDirection = null;
    if (!same) newDir = 'asc';
    else if (dir === 'asc') newDir = 'desc';
    else newDir = null;
    this.sortChange.emit({ key: newDir ? key : '', direction: newDir });
  }

  isSorted(key: string): boolean {
    return this.sortKey() === key && this.sortDir() !== null;
  }

  getSortDirection(key: string): SortDirection {
    return this.sortKey() === key ? this.sortDir() : null;
  }

  getHeaderClasses(col: TableColumn<T>): string[] {
    const cls: string[] = [];
    if (col.sortable) cls.push('sortable');
    if (this.isSorted(col.key)) cls.push('sorted');
    const d = this.getSortDirection(col.key);
    if (d === 'asc') cls.push('sort-asc');
    if (d === 'desc') cls.push('sort-desc');
    if (col.headerClass) cls.push(col.headerClass);
    if (col.sticky === 'start') cls.push('col-sticky-start');
    if (col.sticky === 'end') cls.push('col-sticky-end');
    if (col.hideBelow) cls.push(`col-hide-below-${col.hideBelow}`);
    return cls;
  }

  getCellClasses(col: TableColumn<T>, value: unknown, row: T): string {
    const cls: string[] = [];
    const custom = this.getCellClass(col, value, row);
    if (custom) cls.push(custom);

    const isSpecial =
      this.isImageColumn(col) ||
      this.isBadgeColumn(col) ||
      this.isBooleanColumn(col) ||
      col.type === 'custom';

    if (!isSpecial) {
      if (col.truncate === true) cls.push('cell-truncate');
      else cls.push('cell-wrap');
    }

    if (col.sticky === 'start') cls.push('col-sticky-start');
    if (col.sticky === 'end') cls.push('col-sticky-end');
    if (col.hideBelow) cls.push(`col-hide-below-${col.hideBelow}`);
    return cls.join(' ');
  }

  isImageColumn(col: TableColumn<T>): boolean {
    return col.type === 'image' || IMAGE_KEY_HINTS.has(col.key.toLowerCase());
  }

  isBadgeColumn(col: TableColumn<T>): boolean {
    return col.type === 'badge' || !!(col.badgeMap || col.badgeFn);
  }

  isBooleanColumn(col: TableColumn<T>): boolean {
    return col.type === 'boolean';
  }

  getImageClasses(col: TableColumn<T>): string {
    const cls = ['cell-image'];
    const size =
      col.imageSize ??
      (col.key === 'avatar' || col.key === 'photo' ? 'sm' : undefined);
    if (size && size !== 'md') cls.push(`cell-image--${size}`);
    if (col.imageRound) cls.push('cell-image--round');
    return cls.join(' ');
  }

  getBadgeVariant(col: TableColumn<T>, value: unknown, row: T): BadgeVariant {
    return this._resolveBadge(col, value, row).variant ?? 'neutral';
  }

  getBadgeLabel(col: TableColumn<T>, value: unknown, row: T): string {
    return this._resolveBadge(col, value, row).label ?? String(value ?? '');
  }

  private _resolveBadge(col: TableColumn<T>, value: unknown, row: T): BadgeOption {
    if (col.badgeFn) return col.badgeFn(value, row);
    if (col.badgeMap) {
      const k = String(value ?? '');
      return col.badgeMap[k.toLowerCase()] ?? col.badgeMap[k] ?? { label: k, variant: 'neutral' };
    }
    return { label: String(value ?? ''), variant: 'neutral' };
  }

  getCellClass(col: TableColumn<T>, value: unknown, row: T): string {
    if (typeof col.cellClass === 'function') return col.cellClass(value, row);
    return col.cellClass ?? '';
  }

  formatValue(col: TableColumn<T>, value: unknown, row: T): string {
    if (col.format) return col.format(value, row);
    if (col.pipe) return String(col.pipe.transform(value, ...(col.pipeArgs ?? [])) ?? '');
    if (value == null) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  }

  getRaw(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  isRemixIcon(icon: string): boolean {
    return icon ? icon.startsWith('ri-') : false;
  }

  isActionVisible(action: TableAction<T>, row: T): boolean {
    if (action.show && !action.show(row)) return false;
    if (!action.permission) return true;

    const perms = Array.isArray(action.permission) ? action.permission : [action.permission];
    return action.permissionMode === 'all'
      ? this.authStore.hasAllPermissions(perms)
      : this.authStore.hasAnyPermission(perms);
  }

  hasVisibleActionsForRow(row: T): boolean {
    return this.resolvedActions().some((a) => this.isActionVisible(a, row));
  }
}

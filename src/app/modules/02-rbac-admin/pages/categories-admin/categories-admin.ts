import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, firstValueFrom, of, switchMap, tap } from 'rxjs';
import {
  DataTable,
  type SortEvent,
  type TableAction,
  type TableColumn,
  type TableMeta,
} from '../../components/admin-data-table/admin-data-table';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Breadcrumb } from '../../../../shared/components/breadcrumb/breadcrumb';
import { AdminListToolbar } from '../../components/admin-list-toolbar/admin-list-toolbar';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LocaleDatePipe } from '../../../../shared/pipes/locale-date.pipe';
import { AdminCategoriesService } from '../../services/admin-categories.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import type {
  AdminCategoryBase,
  AdminCategoryDetail,
  AdminCategoryListItem,
  AdminCategoryRelation,
  AdminCategoriesResponse,
  AdminCategoryTreeNode,
  CategorySortBy,
  CategoryStatus,
} from '../../interfaces/admin-category.interface';
import {
  DEFAULT_LIST_LIMIT,
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../utils/admin-list-query.utils';
import { toListMeta } from '../../../../shared/interfaces/list-meta.interface';
import { PERMISSIONS } from '../../../../core/constants/permissions';
import { CategoryTreeNode as EcommerceCategoryTreeNode } from '../../../03-commerce/ecommerce/components/category-tree-node/category-tree-node.component';
import type { Datum } from '../../../03-commerce/ecommerce/pages/categories-page/interfaces/categories-response.interface';

type AdminViewMode = 'table' | 'tree';
type DetailMode = 'view' | 'edit';

interface ParentOption {
  id: string;
  name: string;
  label: string;
  level: number;
}

interface CategoryDetailEditor {
  name: string;
  slug: string;
  description: string;
  status: CategoryStatus;
  isFeatured: boolean;
}

interface DetailChildRow extends AdminCategoryBase {
  children: AdminCategoryRelation[];
  deletedAt: string | null;
}

const localeDate = new LocaleDatePipe();
const DEFAULT_SORT_BY: CategorySortBy = 'createdAt';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'DESC';
const CATEGORY_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

const EMPTY_RESPONSE: AdminCategoriesResponse = {
  data: [],
  meta: { total: 0, limit: DEFAULT_LIST_LIMIT, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'categories-admin-page',
  standalone: true,
  imports: [
    DataTable,
    Pagination,
    Breadcrumb,
    AdminListToolbar,
    HasPermissionDirective,
    EcommerceCategoryTreeNode,
  ],
  templateUrl: './categories-admin.html',
  styleUrl: './categories-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesAdminPage {
  readonly PERMISSIONS = PERMISSIONS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminCategoriesService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(false);
  readonly treeLoading = signal(false);
  readonly detailLoading = signal(false);
  readonly preparingReorder = signal(false);
  readonly reordering = signal(false);
  readonly reorderMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly treeError = signal<string | null>(null);
  readonly selectedNodeError = signal<string | null>(null);
  readonly refreshTick = signal(0);
  readonly reorderDraft = signal<AdminCategoryListItem[] | null>(null);
  readonly reorderBaseline = signal<string[] | null>(null);
  readonly detailMode = signal<DetailMode>('view');
  readonly detailSaving = signal(false);
  readonly childReordering = signal(false);
  readonly childReorderMode = signal(false);
  readonly childReorderDraft = signal<DetailChildRow[] | null>(null);
  readonly childReorderBaseline = signal<string[] | null>(null);
  readonly categoryImageCell = viewChild.required<
    TemplateRef<{
      $implicit: unknown;
      row: AdminCategoryListItem;
      col: TableColumn<AdminCategoryListItem>;
    }>
  >('categoryImageCell');

  readonly detailEditor = linkedSignal<CategoryDetailEditor | null>(() => {
    const category = this.selectedNodeDetail()?.category;
    if (!category) return null;

    return {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      status: category.status,
      isFeatured: category.isFeatured,
    };
  });

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  readonly listParams = computed(() => readListParams(this.queryParams()));
  readonly page = computed(() => this.listParams().page);
  readonly limit = computed(() => this.listParams().limit);
  readonly search = computed(() => this.listParams().search);
  readonly sortBy = computed(() => this.listParams().sortBy);
  readonly order = computed(() => this.listParams().order);
  readonly currentView = computed<AdminViewMode>(() =>
    this.queryParams()['view'] === 'tree' ? 'tree' : 'table',
  );
  readonly statusFilter = computed<CategoryStatus | ''>(() => {
    const value = this.queryParams()['status'];
    return value === 'active' || value === 'inactive' || value === 'deprecated' ? value : '';
  });
  readonly showDeleted = computed(() => this.queryParams()['showDeleted'] === 'true');
  readonly levelFilter = computed<number | ''>(() => {
    const raw = this.queryParams()['level'];
    if (raw === undefined) return '';
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : '';
  });
  readonly parentIdFilter = computed(() => {
    const raw = this.queryParams()['parentId'];
    return typeof raw === 'string' && raw.trim() ? raw : '';
  });
  readonly selectedTreeNodeId = computed(() => {
    const raw = this.queryParams()['node'];
    return typeof raw === 'string' && raw.trim() ? raw : '';
  });
  readonly sortDirection = computed(() => sortDirectionFromOrder(this.order()));
  readonly effectiveSortBy = computed<CategorySortBy>(
    () => (this.sortBy() as CategorySortBy) || DEFAULT_SORT_BY,
  );
  readonly effectiveOrder = computed<'ASC' | 'DESC'>(() => this.order() || DEFAULT_ORDER);

  readonly columns = computed<TableColumn<AdminCategoryListItem>[]>(() => [
    {
      key: 'imageUrl',
      label: 'Imagen',
      type: 'custom',
      width: '88px',
      align: 'center',
      template: this.categoryImageCell(),
    },
    {
      key: 'name',
      label: 'Categoria',
      sortable: true,
      minWidth: '180px',
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
      minWidth: '150px',
      hideBelow: 'md',
    },
    {
      key: 'parent',
      label: 'Padre',
      sortable: true,
      minWidth: '170px',
      format: (value) => {
        const parent = value as AdminCategoryListItem['parent'];
        return parent?.name ?? 'Raiz';
      },
      hideBelow: 'lg',
    },
    {
      key: 'level',
      label: 'Nivel',
      sortable: true,
      width: '82px',
      align: 'center',
    },
    {
      key: 'children',
      label: 'Hijos',
      width: '90px',
      align: 'center',
      format: (value) => String((value as AdminCategoryListItem['children'])?.length ?? 0),
    },
    {
      key: 'order',
      label: 'Orden',
      sortable: true,
      width: '82px',
      align: 'center',
    },
    {
      key: 'isFeatured',
      label: 'Destacada',
      type: 'badge',
      width: '110px',
      align: 'center',
      badgeMap: {
        true: { label: 'Si', variant: 'primary' },
        false: { label: 'No', variant: 'neutral' },
      },
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      type: 'badge',
      width: '120px',
      align: 'center',
      badgeFn: (value, row) => {
        if (row.deletedAt) {
          return { label: 'Eliminada', variant: 'neutral' };
        }

        switch (value) {
          case 'active':
            return { label: 'Activa', variant: 'success' };
          case 'inactive':
            return { label: 'Inactiva', variant: 'warning' };
          case 'deprecated':
            return { label: 'Deprecada', variant: 'danger' };
          default:
            return { label: String(value ?? '—'), variant: 'neutral' };
        }
      },
    },
    {
      key: 'createdAt',
      label: 'Creada',
      sortable: true,
      width: '132px',
      align: 'center',
      pipe: localeDate,
      pipeArgs: ['short'],
      hideBelow: 'lg',
    },
  ]);

  readonly detailChildColumns = computed<TableColumn<DetailChildRow>[]>(() => [
    {
      key: 'imageUrl',
      label: 'Imagen',
      type: 'image',
      width: '84px',
      align: 'center',
    },
    {
      key: 'name',
      label: 'Categoria',
      minWidth: '180px',
    },
    {
      key: 'slug',
      label: 'Slug',
      minWidth: '150px',
      hideBelow: 'md',
    },
    {
      key: 'level',
      label: 'Nivel',
      width: '82px',
      align: 'center',
    },
    {
      key: 'order',
      label: 'Orden',
      width: '82px',
      align: 'center',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: '120px',
      align: 'center',
      badgeFn: (value, row) => {
        if (row.deletedAt) {
          return { label: 'Eliminada', variant: 'neutral' };
        }

        switch (value) {
          case 'active':
            return { label: 'Activa', variant: 'success' };
          case 'inactive':
            return { label: 'Inactiva', variant: 'warning' };
          case 'deprecated':
            return { label: 'Deprecada', variant: 'danger' };
          default:
            return { label: String(value ?? '—'), variant: 'neutral' };
        }
      },
    },
  ]);

  readonly requestParams$ = toObservable(
    computed(() =>
      JSON.stringify({
        page: this.page(),
        limit: this.limit(),
        refreshTick: this.refreshTick(),
        search: this.search() || undefined,
        sortBy: this.sortBy() || undefined,
        order: this.order() || undefined,
        status: this.statusFilter() || undefined,
        showDeleted: this.showDeleted() ? 'true' : undefined,
        level: this.levelFilter() === '' ? undefined : this.levelFilter(),
        parentId: this.parentIdFilter() || undefined,
      }),
    ),
  ).pipe(
    distinctUntilChanged(),
    switchMap((paramsJson) => {
      const parsed: {
        page: number;
        limit: number;
        refreshTick: number;
        search?: string;
        sortBy?: CategorySortBy;
        order?: 'ASC' | 'DESC';
        status?: CategoryStatus;
        showDeleted?: 'true';
        level?: number;
        parentId?: string;
      } = JSON.parse(paramsJson);

      this.loading.set(true);
      this.error.set(null);

      return this.service
        .findAll({
          limit: parsed.limit,
          offset: toApiOffset(parsed.page, parsed.limit),
          search: parsed.search,
          sortBy: parsed.sortBy || DEFAULT_SORT_BY,
          order: parsed.order || DEFAULT_ORDER,
          status: parsed.status,
          showDeleted: parsed.showDeleted === 'true' ? true : undefined,
          level: parsed.level,
          parentId: parsed.parentId,
        })
        .pipe(
          tap(() => {
            this.loading.set(false);
          }),
          catchError((err: { error?: { message?: string }; message?: string }) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'Error al cargar categorias');
            return of(EMPTY_RESPONSE);
          }),
        );
    }),
  );

  readonly treeRequest$ = toObservable(
    computed(() => JSON.stringify({ refreshTick: this.refreshTick() })),
  ).pipe(
    distinctUntilChanged(),
    switchMap(() => {
      this.treeLoading.set(true);
      this.treeError.set(null);

      return this.service.findTree().pipe(
        tap(() => {
          this.treeLoading.set(false);
        }),
        catchError((err: { error?: { message?: string }; message?: string }) => {
          this.treeLoading.set(false);
          this.treeError.set(err?.error?.message ?? err?.message ?? 'Error al cargar el arbol');
          return of({ data: [] as AdminCategoryTreeNode[] });
        }),
      );
    }),
  );

  readonly selectedNodeRequest$ = toObservable(
    computed(() =>
      JSON.stringify({
        node: this.selectedTreeNodeId() || undefined,
        refreshTick: this.refreshTick(),
      }),
    ),
  ).pipe(
    distinctUntilChanged(),
    switchMap((payload) => {
      const parsed: { node?: string } = JSON.parse(payload);
      if (!parsed.node) {
        this.selectedNodeError.set(null);
        return of(null);
      }

      this.detailLoading.set(true);
      this.selectedNodeError.set(null);

      return this.service.findOne(parsed.node).pipe(
        tap(() => {
          this.detailLoading.set(false);
        }),
        catchError((err: { error?: { message?: string }; message?: string }) => {
          this.detailLoading.set(false);
          this.selectedNodeError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo cargar la rama seleccionada',
          );
          return of(null);
        }),
      );
    }),
  );

  readonly response = toSignal(this.requestParams$, { initialValue: EMPTY_RESPONSE });
  readonly treeResponse = toSignal(this.treeRequest$, {
    initialValue: { data: [] as AdminCategoryTreeNode[] },
  });
  readonly selectedNodeDetail = toSignal<AdminCategoryDetail | null>(this.selectedNodeRequest$, {
    initialValue: null,
  });

  readonly data = computed(() => this.response().data);
  readonly meta = computed<TableMeta>(() => {
    const draft = this.reorderDraft();
    if (this.reorderMode() && draft) {
      const limit = this.limit();
      const total = draft.length;
      const page = Math.min(this.page(), Math.max(Math.ceil(total / limit), 1));

      return {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      };
    }

    return toListMeta(this.response().meta);
  });
  readonly tableData = computed<AdminCategoryListItem[]>(() => {
    const draft = this.reorderDraft();
    if (this.reorderMode() && draft) {
      const start = toApiOffset(this.page(), this.limit());
      return draft.slice(start, start + this.limit());
    }

    return this.data().map((category) => this.normalizeCategoryItem(category));
  });
  readonly treeData = computed(() => this.treeResponse().data ?? []);
  readonly parentOptions = computed(() => this.flattenTreeOptions(this.treeData()));
  readonly availableLevels = computed(() => {
    const maxLevel = this.parentOptions().reduce((max, option) => Math.max(max, option.level), 0);
    return Array.from({ length: maxLevel + 1 }, (_, index) => index);
  });
  readonly selectedParentOption = computed(
    () => this.parentOptions().find((option) => option.id === this.parentIdFilter()) ?? null,
  );
  readonly selectedParentLabel = computed(() => this.selectedParentOption()?.label ?? '');
  readonly treeBranch = computed<Datum[]>(() => this.treeData().map((node) => this.toDatum(node)));
  readonly selectedTreeCategory = computed<AdminCategoryBase | null>(() => {
    const selectedDetail = this.selectedNodeDetail();
    if (selectedDetail?.category) {
      return selectedDetail.category;
    }

    const selectedId = this.selectedTreeNodeId();
    return selectedId ? this.findNodeById(this.treeData(), selectedId) : null;
  });
  readonly selectedTreeChildren = computed<DetailChildRow[]>(() => {
    const detail = this.selectedNodeDetail();
    if (!detail?.children?.length) return [];
    return detail.children.map((child) => this.toDetailChildRow(child));
  });
  readonly selectedTreeCounts = computed(() => {
    const branch = this.treeData().reduce((sum, root) => sum + this.countNodes(root), 0);
    return {
      roots: this.treeData().length,
      visible: branch,
    };
  });
  readonly detailChildrenTableData = computed<DetailChildRow[]>(() => {
    const draft = this.childReorderDraft();
    if (this.childReorderMode() && draft) {
      return draft;
    }

    return this.selectedTreeChildren();
  });

  readonly rowActions = computed<TableAction<AdminCategoryListItem>[]>(() => {
    if (this.reorderMode()) {
      return this.reorderActions();
    }

    return [
      {
        icon: 'visibility',
        label: 'Ver',
        permission: PERMISSIONS.CATEGORIES.READ,
        callback: (category) => this.goToDetailPage(category.id),
      },
      {
        icon: 'edit',
        label: 'Editar',
        permission: PERMISSIONS.CATEGORIES.UPDATE,
        show: (category) => !category.deletedAt,
        callback: (category) => this.goToEditPage(category.id),
      },
      {
        icon: 'account_tree',
        label: 'Ver hijos',
        permission: PERMISSIONS.CATEGORIES.READ,
        show: (category) => category.children.length > 0,
        callback: (category) => this.openChildrenList(category),
      },
      {
        icon: 'delete',
        label: 'Eliminar',
        class: 'btn-delete',
        permission: PERMISSIONS.CATEGORIES.DELETE,
        show: (category) => !category.deletedAt && category.children.length === 0,
        callback: (category) => this.deleteCategory(category),
      },
    ];
  });

  readonly detailChildActions = computed<TableAction<DetailChildRow>[]>(() => {
    if (this.childReorderMode()) return [];

    return [
      {
        icon: 'ri-node-tree',
        label: 'Ver',
        permission: PERMISSIONS.CATEGORIES.READ,
        callback: (category) => this.openTreeDetail(category),
      },
      {
        icon: 'ri-edit-line',
        label: 'Editar',
        permission: PERMISSIONS.CATEGORIES.UPDATE,
        show: (category) => !category.deletedAt,
        callback: (category) => this.openTreeEditor(category),
      },
      {
        icon: 'ri-delete-bin-line',
        label: 'Eliminar',
        class: 'action-btn--danger',
        permission: PERMISSIONS.CATEGORIES.DELETE,
        show: (category) => !category.deletedAt,
        callback: (category) => this.deleteCategory(category),
      },
    ];
  });

  readonly reorderActions = computed<TableAction<AdminCategoryListItem>[]>(() => {
    if (!this.reorderMode()) return [];

    return [
      {
        icon: 'chevron_left',
        label: 'Enviar a pagina anterior',
        class: 'action-btn--secondary',
        show: (category) => this.canMoveToPreviousPage(category),
        callback: (category) => this.moveToPreviousPage(category),
      },
      {
        icon: 'chevron_right',
        label: 'Enviar a pagina siguiente',
        class: 'action-btn--secondary',
        show: (category) => this.canMoveToNextPage(category),
        callback: (category) => this.moveToNextPage(category),
      },
    ];
  });

  readonly canStartReorder = computed(() => {
    return !this.loading() && !this.preparingReorder() && !this.reordering();
  });

  readonly canSaveReorder = computed(() => {
    const draft = this.reorderDraft();
    const baseline = this.reorderBaseline();
    if (!this.reorderMode() || !draft || !baseline || draft.length !== baseline.length) return false;

    return draft.some((item, index) => item.id !== baseline[index]);
  });

  readonly reorderBlockedReason = computed(() => {
    if (this.loading()) return 'Cargando categorias...';
    if (this.preparingReorder()) return 'Preparando reordenamiento...';
    if (this.reordering()) return 'Guardando reordenamiento...';
    return null;
  });

  readonly reorderScopeLabel = computed(() => {
    if (this.parentIdFilter()) {
      return this.selectedParentOption()?.name ?? 'categoria seleccionada';
    }

    if (this.levelFilter() === 0 || this.levelFilter() === '') {
      return 'categorias raiz';
    }

    return 'categoria actual';
  });

  readonly hasActiveFilters = computed(
    () =>
      !!this.search() ||
      !!this.sortBy() ||
      !!this.statusFilter() ||
      this.showDeleted() ||
      this.levelFilter() !== '' ||
      !!this.parentIdFilter(),
  );

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.sortBy()) count++;
    if (this.statusFilter()) count++;
    if (this.showDeleted()) count++;
    if (this.levelFilter() !== '') count++;
    if (this.parentIdFilter()) count++;
    return count;
  });

  async onViewChange(view: AdminViewMode): Promise<void> {
    await this.navigateQuery({ view, page: view === 'table' ? this.page() : null });
  }

  onSearch(value: string): void {
    void this.navigateQuery({ search: value, page: 1 });
  }

  onStatusFilter(value: string): void {
    void this.navigateQuery({ status: value || null, page: 1 });
  }

  onLevelFilter(value: string): void {
    void this.navigateQuery({
      level: value || null,
      parentId: value ? null : this.parentIdFilter() || null,
      page: 1,
    });
  }

  onShowDeletedChange(checked: boolean): void {
    void this.navigateQuery({ showDeleted: checked ? 'true' : null, page: 1 });
  }

  onSort(event: SortEvent): void {
    void this.navigateQuery({
      sortBy: event.direction ? event.key : null,
      order: event.direction ? event.direction.toUpperCase() : null,
      page: 1,
    });
  }

  onPageChange(page: number): void {
    void this.navigateQuery({ page });
  }

  onLimitChange(limit: number): void {
    void this.navigateQuery({ limit, page: 1 });
  }

  onClearFilters(): void {
    void this.navigateQuery({
      search: null,
      sortBy: null,
      order: null,
      status: null,
      showDeleted: null,
      level: null,
      parentId: null,
      page: 1,
    });
  }

  async startReorderMode(): Promise<void> {
    if (!this.canStartReorder()) return;

    this.preparingReorder.set(true);
    this.error.set(null);

    try {
      const reorderScope = this.buildReorderScope();

      await this.navigateQuery(reorderScope.queryPatch);

      const allCategories = await this.loadAllCategoriesForReorder(reorderScope);
      if (allCategories.length < 2) {
        this.error.set('Se necesitan al menos dos categorias hermanas para reordenar.');
        return;
      }

      this.reorderDraft.set(allCategories);
      this.reorderBaseline.set(allCategories.map((category) => category.id));
      this.reorderMode.set(true);
    } catch (err) {
      const error = err as { error?: { message?: string }; message?: string };
      this.error.set(
        error?.error?.message ?? error?.message ?? 'No se pudo iniciar el reordenamiento de categorias',
      );
    } finally {
      this.preparingReorder.set(false);
    }
  }

  cancelReorderMode(): void {
    this.reorderMode.set(false);
    this.reorderDraft.set(null);
    this.reorderBaseline.set(null);
  }

  saveReorder(): void {
    const draft = this.reorderDraft();
    if (!this.canSaveReorder() || !draft) return;

    this.reordering.set(true);
    this.error.set(null);

    this.service.reorder({ categoryIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.reordering.set(false);
        this.cancelReorderMode();
        this.toastService.success(
          'Orden actualizado',
          'Las categorias fueron reordenadas correctamente.',
        );
        this.refreshTick.update((value) => value + 1);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.reordering.set(false);
        this.error.set(
          err?.error?.message ?? err?.message ?? 'No se pudo reordenar categorias',
        );
      },
    });
  }

  onRowReorder(event: { fromIndex: number; toIndex: number; row: AdminCategoryListItem }): void {
    void event.row;
    const draft = this.reorderDraft();
    if (!this.reorderMode() || !draft) return;

    const pageOffset = toApiOffset(this.page(), this.limit());
    const fromIndex = pageOffset + event.fromIndex;
    const toIndex = pageOffset + event.toIndex;
    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) return;

    nextDraft.splice(toIndex, 0, moved);
    this.reorderDraft.set(nextDraft);
  }

  onTreeNodeSelected(node: Datum): void {
    this.detailMode.set('view');
    void this.navigateQuery({ view: 'tree', node: node.id });
  }

  showAllTree(): void {
    this.detailMode.set('view');
    this.childReorderMode.set(false);
    this.childReorderDraft.set(null);
    this.childReorderBaseline.set(null);
    void this.navigateQuery({ view: 'tree', node: null });
  }

  showChildrenInTable(): void {
    const selected = this.selectedTreeCategory();
    if (!selected) return;

    this.openChildrenList(selected);
  }

  clearParentFilter(): void {
    void this.navigateQuery({ parentId: null, page: 1 });
  }

  onTreeView(node: Datum): void {
    void this.router.navigate(['/admin/categorias', node.id], {
      queryParamsHandling: 'preserve',
    });
  }

  onTreeEdit(node: Datum): void {
    void this.router.navigate(['/admin/categorias', node.id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  onTreeDelete(node: Datum): void {
    this.deleteCategory(node);
  }

  goToCreatePage(): void {
    void this.router.navigate(['/admin/categorias/crear'], {
      queryParamsHandling: 'preserve',
    });
  }

  private goToDetailPage(id: string): void {
    void this.router.navigate(['/admin/categorias', id], {
      queryParamsHandling: 'preserve',
    });
  }

  private goToEditPage(id: string): void {
    void this.router.navigate(['/admin/categorias', id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  startDetailEdit(): void {
    this.detailMode.set('edit');
  }

  cancelDetailEdit(): void {
    this.detailMode.set('view');
    this.detailEditor.set(
      this.selectedNodeDetail()?.category
        ? {
            name: this.selectedNodeDetail()!.category.name,
            slug: this.selectedNodeDetail()!.category.slug,
            description: this.selectedNodeDetail()!.category.description ?? '',
            status: this.selectedNodeDetail()!.category.status,
            isFeatured: this.selectedNodeDetail()!.category.isFeatured,
          }
        : null,
    );
  }

  updateDetailField<K extends keyof CategoryDetailEditor>(key: K, value: CategoryDetailEditor[K]): void {
    this.detailEditor.update((draft) => (draft ? { ...draft, [key]: value } : draft));
  }

  saveDetailEdit(): void {
    const category = this.selectedNodeDetail()?.category;
    const draft = this.detailEditor();
    if (!category || !draft || this.detailSaving()) return;

    this.detailSaving.set(true);
    this.selectedNodeError.set(null);

    this.service
      .update(category.id, {
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        description: draft.description.trim(),
        status: draft.status,
        isFeatured: draft.isFeatured,
      })
      .subscribe({
        next: (result) => {
          this.detailSaving.set(false);
          this.detailMode.set('view');
          this.toastService.success('Categoria actualizada', `La categoria "${result.category.name}" fue actualizada correctamente.`);
          this.refreshTick.update((value) => value + 1);
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.detailSaving.set(false);
          this.selectedNodeError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo actualizar la categoria',
          );
        },
      });
  }

  startChildReorder(): void {
    const children = this.selectedTreeChildren();
    if (children.length < 2) return;

    this.childReorderMode.set(true);
    this.childReorderDraft.set(children.map((child) => ({ ...child })));
    this.childReorderBaseline.set(children.map((child) => child.id));
  }

  cancelChildReorder(): void {
    this.childReorderMode.set(false);
    this.childReorderDraft.set(null);
    this.childReorderBaseline.set(null);
  }

  saveChildReorder(): void {
    const category = this.selectedTreeCategory();
    const draft = this.childReorderDraft();
    const baseline = this.childReorderBaseline();
    if (!category || !draft || !baseline || this.childReordering()) return;
    if (!draft.some((item, index) => item.id !== baseline[index])) return;

    this.childReordering.set(true);
    this.selectedNodeError.set(null);

    this.service.reorder({ categoryIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.childReordering.set(false);
        this.cancelChildReorder();
        this.toastService.success('Orden actualizado', `Los hijos de "${category.name}" fueron reordenados correctamente.`);
        this.refreshTick.update((value) => value + 1);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.childReordering.set(false);
        this.selectedNodeError.set(
          err?.error?.message ?? err?.message ?? 'No se pudo reordenar las subcategorias',
        );
      },
    });
  }

  onChildRowReorder(event: { fromIndex: number; toIndex: number; row: DetailChildRow }): void {
    void event.row;
    const draft = this.childReorderDraft();
    if (!this.childReorderMode() || !draft) return;

    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(event.fromIndex, 1);
    if (!moved) return;

    nextDraft.splice(event.toIndex, 0, moved);
    this.childReorderDraft.set(nextDraft);
  }

  private openTreeDetail(category: Pick<AdminCategoryBase, 'id'>): void {
    this.detailMode.set('view');
    void this.navigateQuery({ view: 'tree', node: category.id });
  }

  private openTreeEditor(category: Pick<AdminCategoryBase, 'id'>): void {
    this.detailMode.set('edit');
    void this.navigateQuery({ view: 'tree', node: category.id });
  }

  private openChildrenList(category: Pick<AdminCategoryBase, 'id'>): void {
    void this.navigateQuery({
      view: 'table',
      parentId: category.id,
      level: null,
      search: null,
      sortBy: 'order',
      order: 'ASC',
      page: 1,
    });
  }

  private deleteCategory(category: Pick<AdminCategoryBase, 'id' | 'name'>): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Categoria',
        message: `Estas seguro de eliminar la categoria "${category.name}"? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(category.id).subscribe({
          next: () => {
            this.toastService.success(
              'Categoria eliminada',
              `La categoria "${category.name}" fue eliminada correctamente.`,
            );
            if (this.selectedTreeNodeId() === category.id) {
              this.showAllTree();
            }
            this.refreshTick.update((value) => value + 1);
          },
          error: (err: { error?: { message?: string }; message?: string }) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'Error al eliminar categoria');
          },
        });
      });
  }

  private normalizeCategoryItem(category: AdminCategoryListItem): AdminCategoryListItem {
    return {
      ...category,
      imageUrl: category.imageUrl || category.image || CATEGORY_IMAGE_PLACEHOLDER,
      image: category.image || category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER,
    };
  }

  private async loadAllCategoriesForReorder(scope: { parentId: string | null; level: number | null }): Promise<AdminCategoryListItem[]> {
    const total = Math.max(this.response().meta.total, this.data().length, this.limit(), 100);
    const response = await firstValueFrom(
      this.service.findAll({
        limit: total,
        offset: 0,
        sortBy: 'order',
        order: 'ASC',
        ...(scope.parentId ? { parentId: scope.parentId } : { level: scope.level ?? 0 }),
      }),
    );

    return response.data.map((category) => this.normalizeCategoryItem(category));
  }

  private buildReorderScope(): { parentId: string | null; level: number | null; queryPatch: Record<string, string | number | null> } {
    const parentId = this.parentIdFilter() || null;

    if (parentId) {
      return {
        parentId,
        level: null,
        queryPatch: {
          view: 'table',
          search: null,
          status: null,
          showDeleted: null,
          sortBy: 'order',
          order: 'ASC',
          level: null,
          parentId,
          page: 1,
        },
      };
    }

    return {
      parentId: null,
      level: 0,
      queryPatch: {
        view: 'table',
        search: null,
        status: null,
        showDeleted: null,
        sortBy: 'order',
        order: 'ASC',
        level: 0,
        parentId: null,
        page: 1,
      },
    };
  }

  private canMoveToPreviousPage(category: AdminCategoryListItem): boolean {
    const draft = this.reorderDraft();
    if (!this.reorderMode() || !draft || this.page() <= 1) return false;

    return draft.findIndex((item) => item.id === category.id) >= this.currentPageStartIndex();
  }

  private canMoveToNextPage(category: AdminCategoryListItem): boolean {
    const draft = this.reorderDraft();
    if (!this.reorderMode() || !draft) return false;

    return this.page() < this.totalDraftPages(draft.length);
  }

  private moveToPreviousPage(category: AdminCategoryListItem): void {
    const draft = this.reorderDraft();
    if (!draft) return;

    const fromIndex = draft.findIndex((item) => item.id === category.id);
    const targetIndex = Math.max(this.currentPageStartIndex() - 1, 0);
    if (fromIndex < 0 || fromIndex === targetIndex) return;

    this.reorderDraft.set(this.moveDraftItemAcrossPages(draft, fromIndex, targetIndex));
    this.goToReorderPage(this.page() - 1);
  }

  private moveToNextPage(category: AdminCategoryListItem): void {
    const draft = this.reorderDraft();
    if (!draft) return;

    const fromIndex = draft.findIndex((item) => item.id === category.id);
    const targetIndex = Math.min(this.currentPageStartIndex() + this.limit(), draft.length);
    if (fromIndex < 0 || fromIndex === targetIndex) return;

    this.reorderDraft.set(this.moveDraftItemAcrossPages(draft, fromIndex, targetIndex));
    this.goToReorderPage(this.page() + 1);
  }

  private currentPageStartIndex(): number {
    return toApiOffset(this.page(), this.limit());
  }

  private totalDraftPages(totalItems: number): number {
    return Math.max(Math.ceil(totalItems / this.limit()), 1);
  }

  private moveDraftItemAcrossPages(
    draft: AdminCategoryListItem[],
    fromIndex: number,
    targetIndex: number,
  ): AdminCategoryListItem[] {
    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) return draft;

    nextDraft.splice(targetIndex, 0, moved);
    return nextDraft;
  }

  private goToReorderPage(page: number): void {
    const nextPage = Math.max(page, 1);
    const nextQuery = buildListQueryPatch(this.queryParams(), { page: nextPage });
    const currentQuery = buildListQueryPatch(this.queryParams(), {});

    if (areSameQueryParams(currentQuery, nextQuery)) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: nextQuery,
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }

  private isReorderScopeValid(): boolean {
    return !!this.parentIdFilter() || this.levelFilter() === 0 || this.levelFilter() === '';
  }

  private async navigateQuery(
    patch: Record<string, string | number | null | undefined>,
  ): Promise<void> {
    const shouldKeepReorderMode = this.isPaginationOnlyPatch(patch);

    if (this.reorderMode()) {
      const shouldContinue = await this.confirmReorderNavigation(patch, shouldKeepReorderMode);
      if (!shouldContinue) return;
      if (!shouldKeepReorderMode) {
        this.cancelReorderMode();
      }
    }

    const nextQuery = buildListQueryPatch(this.queryParams(), patch);
    const currentQuery = buildListQueryPatch(this.queryParams(), {});

    if (areSameQueryParams(currentQuery, nextQuery)) {
      return;
    }

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: nextQuery,
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }

  private isPaginationOnlyPatch(
    patch: Record<string, string | number | null | undefined>,
  ): boolean {
    const keys = Object.keys(patch);
    return keys.length > 0 && keys.every((key) => key === 'page' || key === 'limit');
  }

  private async confirmReorderNavigation(
    patch: Record<string, string | number | null | undefined>,
    keepReorderMode: boolean,
  ): Promise<boolean> {
    if (!this.canSaveReorder()) return true;

    if (keepReorderMode) {
      const targetPage = Number(patch['page'] ?? this.page());
      const movementMessage =
        targetPage < this.page()
          ? 'El ultimo registro de la pagina anterior puede entrar en esta pagina.'
          : 'Uno de los registros de esta pagina puede pasar a la siguiente, o el primero de la siguiente puede venir a esta pagina.';

      return this.dialogService.confirm({
        title: 'Guardar cambios antes de paginar',
        message:
          `Tienes cambios de orden sin guardar. Te recomendamos guardar antes de cambiar de pagina. ` +
          `Si continuas, la composicion entre paginas puede moverse. ${movementMessage}`,
        confirmText: 'Continuar',
        cancelText: 'Seguir editando',
        type: 'warning',
      });
    }

    return this.dialogService.confirm({
      title: 'Salir del modo reordenar',
      message:
        'Tienes cambios de orden sin guardar. Si cambias filtros, vista o arbol, el borrador actual se perdera. Guarda primero si quieres conservarlo.',
      confirmText: 'Descartar borrador',
      cancelText: 'Seguir editando',
      type: 'warning',
    });
  }

  private flattenTreeOptions(
    nodes: AdminCategoryTreeNode[],
    level = 0,
    acc: ParentOption[] = [],
  ): ParentOption[] {
    for (const node of nodes) {
      acc.push({
        id: node.id,
        name: node.name,
        label: `${'  '.repeat(level)}${node.name}`,
        level,
      });

      if (node.children?.length) {
        this.flattenTreeOptions(node.children, level + 1, acc);
      }
    }

    return acc;
  }

  private toDetailChildRow(category: AdminCategoryBase): DetailChildRow {
    return {
      ...category,
      imageUrl: category.imageUrl || category.image || CATEGORY_IMAGE_PLACEHOLDER,
      image: category.image || category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER,
      children: [],
      deletedAt: null,
    };
  }

  private toDatum(node: AdminCategoryTreeNode): Datum {
    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      description: node.description ?? null,
      image: node.image || CATEGORY_IMAGE_PLACEHOLDER,
      order: node.order,
      level: node.level,
      status: node.status,
      isFeatured: node.isFeatured,
      children: (node.children ?? []).map((child) => this.toDatum(child)),
    };
  }

  private findNodeById(
    nodes: AdminCategoryTreeNode[],
    id: string,
  ): AdminCategoryTreeNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = this.findNodeById(node.children ?? [], id);
      if (child) return child;
    }

    return null;
  }

  private countNodes(node: AdminCategoryTreeNode): number {
    return 1 + (node.children ?? []).reduce((sum, child) => sum + this.countNodes(child), 0);
  }
}

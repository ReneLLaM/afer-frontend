import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
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
import { AdminBrandsService } from '../../services/admin-brands.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import type {
  AdminBrandListItem,
  AdminBrandsResponse,
  BrandSortBy,
  BrandStatus,
} from '../../interfaces/admin-brand.interface';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../utils/admin-list-query.utils';
import { toListMeta } from '../../../../shared/interfaces/list-meta.interface';
import { PERMISSIONS } from '../../../../core/constants/permissions';

const localeDate = new LocaleDatePipe();
const DEFAULT_SORT_BY: BrandSortBy = 'order';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'ASC';
const BRAND_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

const EMPTY_RESPONSE: AdminBrandsResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'brands-admin-page',
  standalone: true,
  imports: [DataTable, Pagination, Breadcrumb, AdminListToolbar, HasPermissionDirective],
  templateUrl: './brands-admin.html',
  styleUrl: './brands-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminPage {
  readonly PERMISSIONS = PERMISSIONS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminBrandsService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(false);
  readonly preparingReorder = signal(false);
  readonly reordering = signal(false);
  readonly reorderMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly refreshTick = signal(0);
  readonly reorderDraft = signal<AdminBrandListItem[] | null>(null);
  readonly reorderBaseline = signal<string[] | null>(null);
  readonly brandImageCell = viewChild.required<
    TemplateRef<{
      $implicit: unknown;
      row: AdminBrandListItem;
      col: TableColumn<AdminBrandListItem>;
    }>
  >('brandImageCell');

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  readonly listParams = computed(() => readListParams(this.queryParams()));
  readonly page = computed(() => this.listParams().page);
  readonly limit = computed(() => this.listParams().limit);
  readonly search = computed(() => this.listParams().search);
  readonly sortBy = computed(() => this.listParams().sortBy);
  readonly order = computed(() => this.listParams().order);
  readonly statusFilter = computed<BrandStatus | ''>(() => {
    const value = this.queryParams()['status'];
    return value === 'active' || value === 'inactive' || value === 'deprecated'
      ? value
      : '';
  });
  readonly showDeleted = computed(() => this.queryParams()['showDeleted'] === 'true');
  readonly sortDirection = computed(() => sortDirectionFromOrder(this.order()));
  readonly effectiveSortBy = computed<BrandSortBy>(() => (this.sortBy() as BrandSortBy) || DEFAULT_SORT_BY);
  readonly effectiveOrder = computed<'ASC' | 'DESC'>(() => this.order() || DEFAULT_ORDER);

  readonly columns = computed<TableColumn<AdminBrandListItem>[]>(() => [
    {
      key: 'imageUrl',
      label: 'Imagen',
      type: 'custom',
      width: '88px',
      align: 'center',
      template: this.brandImageCell(),
    },
    {
      key: 'name',
      label: 'Marca',
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
      key: 'description',
      label: 'Descripcion',
      minWidth: '240px',
      format: (value) => (value ? String(value) : '—'),
      hideBelow: 'lg',
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
      sortable: true,
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

  readonly tableCrud = {
    view: {
      permission: PERMISSIONS.BRANDS.READ,
      onClick: (brand: AdminBrandListItem) => this.viewBrand(brand),
    },
    edit: {
      permission: PERMISSIONS.BRANDS.UPDATE,
      show: (brand: AdminBrandListItem) => !brand.deletedAt,
      onClick: (brand: AdminBrandListItem) => this.editBrand(brand),
    },
    delete: {
      permission: PERMISSIONS.BRANDS.DELETE,
      show: (brand: AdminBrandListItem) => !brand.deletedAt,
      onClick: (brand: AdminBrandListItem) => this.deleteBrand(brand),
    },
  };

  readonly reorderActions = computed<TableAction<AdminBrandListItem>[]>(() => {
    if (!this.reorderMode()) return [];

    return [
      {
        icon: 'chevron_left',
        label: 'Enviar a pagina anterior',
        class: 'action-btn--secondary',
        show: (brand) => this.canMoveToPreviousPage(brand),
        callback: (brand) => this.moveToPreviousPage(brand),
      },
      {
        icon: 'chevron_right',
        label: 'Enviar a pagina siguiente',
        class: 'action-btn--secondary',
        show: (brand) => this.canMoveToNextPage(brand),
        callback: (brand) => this.moveToNextPage(brand),
      },
    ];
  });

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
        sortBy?: BrandSortBy;
        order?: 'ASC' | 'DESC';
        status?: BrandStatus;
        showDeleted?: 'true';
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
        })
        .pipe(
          tap(() => {
            this.loading.set(false);
          }),
          catchError((err: { error?: { message?: string }; message?: string }) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'Error al cargar marcas');
            return of(EMPTY_RESPONSE);
          }),
        );
    }),
  );

  readonly response = toSignal(this.requestParams$, { initialValue: EMPTY_RESPONSE });
  readonly data = computed(() => this.response().data);
  readonly meta = computed<TableMeta>(() => toListMeta(this.response().meta));
  readonly tableData = computed<AdminBrandListItem[]>(() => {
    const draft = this.reorderDraft();
    if (this.reorderMode() && draft) {
      const start = toApiOffset(this.page(), this.limit());
      return draft.slice(start, start + this.limit());
    }

    return this.data().map((brand) => this.normalizeBrandItem(brand));
  });

  readonly canStartReorder = computed(() => {
    const meta = this.response().meta;

    return (
      !this.loading() &&
      !this.preparingReorder() &&
      !this.reordering() &&
      !this.search() &&
      !this.statusFilter() &&
      !this.showDeleted() &&
      this.effectiveSortBy() === 'order' &&
      this.effectiveOrder() === 'ASC' &&
      meta.total > 1
    );
  });

  readonly canSaveReorder = computed(() => {
    const draft = this.reorderDraft();
    const baseline = this.reorderBaseline();
    if (!this.reorderMode() || !draft || !baseline || draft.length !== baseline.length) return false;

    return draft.some((item, index) => item.id !== baseline[index]);
  });

  readonly reorderBlockedReason = computed(() => {
    const meta = this.response().meta;

    if (this.showDeleted()) return 'Oculta las eliminadas para reordenar.';
    if (this.search()) return 'Limpia la busqueda para reordenar.';
    if (this.statusFilter()) return 'Quita el filtro de estado para reordenar.';
    if (this.effectiveSortBy() !== 'order' || this.effectiveOrder() !== 'ASC') {
      return 'Ordena por la columna Orden en ascendente para reordenar.';
    }
    if (meta.total <= 1) return 'Se necesitan al menos dos marcas para reordenar.';

    return null;
  });

  readonly hasActiveFilters = computed(
    () => !!this.search() || !!this.sortBy() || !!this.statusFilter() || this.showDeleted(),
  );

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.sortBy()) count++;
    if (this.statusFilter()) count++;
    if (this.showDeleted()) count++;
    return count;
  });

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

  onSearch(value: string): void {
    void this.navigateQuery({ search: value, page: 1 });
  }

  onStatusFilter(value: string): void {
    void this.navigateQuery({ status: value || null, page: 1 });
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
      page: 1,
    });
  }

  onCreateBrand(): void {
    this.router.navigate(['/admin/marcas/crear'], {
      queryParams: this.queryParams(),
    });
  }

  async startReorderMode(): Promise<void> {
    if (!this.canStartReorder()) return;

    this.preparingReorder.set(true);
    this.error.set(null);

    try {
      const allBrands = await this.loadAllBrandsForReorder();
      this.reorderDraft.set(allBrands);
      this.reorderBaseline.set(allBrands.map((brand) => brand.id));
      this.reorderMode.set(true);
    } catch (err) {
      const error = err as { error?: { message?: string }; message?: string };
      this.error.set(error?.error?.message ?? error?.message ?? 'No se pudo iniciar el reordenamiento de marcas');
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

    this.service.reorder({ brandIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.reordering.set(false);
        this.cancelReorderMode();
        this.toastService.success('Orden actualizado', 'Las marcas fueron reordenadas correctamente.');
        this.refreshTick.update((value) => value + 1);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.reordering.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo reordenar marcas');
      },
    });
  }

  onRowReorder(event: { fromIndex: number; toIndex: number; row: AdminBrandListItem }): void {
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

  moveToPreviousPage(brand: AdminBrandListItem): void {
    const draft = this.reorderDraft();
    if (!draft) return;

    const fromIndex = draft.findIndex((item) => item.id === brand.id);
    const targetIndex = Math.max(this.currentPageStartIndex() - 1, 0);
    if (fromIndex < 0 || fromIndex === targetIndex) return;

    this.reorderDraft.set(this.moveDraftItemAcrossPages(draft, fromIndex, targetIndex));
    this.goToReorderPage(this.page() - 1);
  }

  moveToNextPage(brand: AdminBrandListItem): void {
    const draft = this.reorderDraft();
    if (!draft) return;

    const fromIndex = draft.findIndex((item) => item.id === brand.id);
    const targetIndex = Math.min(this.currentPageStartIndex() + this.limit(), draft.length);
    if (fromIndex < 0 || fromIndex === targetIndex) return;

    this.reorderDraft.set(this.moveDraftItemAcrossPages(draft, fromIndex, targetIndex));
    this.goToReorderPage(this.page() + 1);
  }

  private viewBrand(brand: AdminBrandListItem): void {
    this.router.navigate(['/admin/marcas', brand.id], {
      queryParams: this.queryParams(),
    });
  }

  private editBrand(brand: AdminBrandListItem): void {
    this.router.navigate(['/admin/marcas', brand.id, 'editar'], {
      queryParams: this.queryParams(),
    });
  }

  private deleteBrand(brand: AdminBrandListItem): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Marca',
        message: `¿Estas seguro de eliminar la marca "${brand.name}"? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(brand.id).subscribe({
          next: () => {
            this.toastService.success('Marca eliminada', `La marca "${brand.name}" fue eliminada correctamente.`);
            this.refreshTick.update((value) => value + 1);
          },
          error: (err: { error?: { message?: string }; message?: string }) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'Error al eliminar marca');
          },
        });
      });
  }

  private normalizeBrandItem(brand: AdminBrandListItem): AdminBrandListItem {
    return {
      ...brand,
      imageUrl: brand.imageUrl || brand.image || BRAND_IMAGE_PLACEHOLDER,
      image: brand.image || brand.imageUrl || BRAND_IMAGE_PLACEHOLDER,
    };
  }

  private async loadAllBrandsForReorder(): Promise<AdminBrandListItem[]> {
    const total = Math.max(this.response().meta.total, this.data().length, this.limit());
    const response = await firstValueFrom(
      this.service.findAll({
        limit: total,
        offset: 0,
        sortBy: 'order',
        order: 'ASC',
      }),
    );

    return response.data.map((brand) => this.normalizeBrandItem(brand));
  }

  private canMoveToPreviousPage(brand: AdminBrandListItem): boolean {
    const draft = this.reorderDraft();
    if (!this.reorderMode() || !draft || this.page() <= 1) return false;

    return draft.findIndex((item) => item.id === brand.id) >= this.currentPageStartIndex();
  }

  private canMoveToNextPage(brand: AdminBrandListItem): boolean {
    const draft = this.reorderDraft();
    if (!this.reorderMode() || !draft) return false;

    return this.page() < this.totalDraftPages(draft.length);
  }

  private currentPageStartIndex(): number {
    return toApiOffset(this.page(), this.limit());
  }

  private totalDraftPages(totalItems: number): number {
    return Math.max(Math.ceil(totalItems / this.limit()), 1);
  }

  private moveDraftItem(
    draft: AdminBrandListItem[],
    fromIndex: number,
    targetIndex: number,
  ): AdminBrandListItem[] {
    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) return draft;

    const normalizedTarget = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    nextDraft.splice(normalizedTarget, 0, moved);
    return nextDraft;
  }

  private moveDraftItemAcrossPages(
    draft: AdminBrandListItem[],
    fromIndex: number,
    targetIndex: number,
  ): AdminBrandListItem[] {
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
        'Tienes cambios de orden sin guardar. Si cambias filtros o orden del listado, el borrador actual se perdera. Guarda primero si quieres conservarlo.',
      confirmText: 'Descartar borrador',
      cancelText: 'Seguir editando',
      type: 'warning',
    });
  }
}

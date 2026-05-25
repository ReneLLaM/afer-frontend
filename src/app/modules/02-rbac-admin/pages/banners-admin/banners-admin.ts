import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
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
import { AdminBannersService } from '../../services/admin-banners.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import type {
  AdminBannerListItem,
  AdminBannersResponse,
  BannerSortBy,
  BannerStatus,
} from '../../interfaces/admin-banner.interface';
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
const DEFAULT_SORT_BY: BannerSortBy = 'order';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'ASC';

const EMPTY_RESPONSE: AdminBannersResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'banners-admin-page',
  standalone: true,
  imports: [DataTable, Pagination, Breadcrumb, AdminListToolbar, HasPermissionDirective],
  templateUrl: './banners-admin.html',
  styleUrl: './banners-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannersAdminPage {
  readonly PERMISSIONS = PERMISSIONS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminBannersService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  loading = signal(false);
  preparingReorder = signal(false);
  reordering = signal(false);
  reorderMode = signal(false);
  error = signal<string | null>(null);
  refreshTick = signal(0);
  reorderDraft = signal<AdminBannerListItem[] | null>(null);
  reorderBaseline = signal<string[] | null>(null);

  queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  listParams = computed(() => readListParams(this.queryParams()));
  page = computed(() => this.listParams().page);
  limit = computed(() => this.listParams().limit);
  search = computed(() => this.listParams().search);
  sortBy = computed(() => this.listParams().sortBy);
  order = computed(() => this.listParams().order);
  statusFilter = computed<'' | BannerStatus>(() => {
    const value = this.queryParams()['status'];
    return value === 'active' || value === 'inactive' ? value : '';
  });
  showDeleted = computed(() => this.queryParams()['showDeleted'] === 'true');
  sortDirection = computed(() => sortDirectionFromOrder(this.order()));
  effectiveSortBy = computed<BannerSortBy>(() => (this.sortBy() as BannerSortBy) || DEFAULT_SORT_BY);
  effectiveOrder = computed<'ASC' | 'DESC'>(() => this.order() || DEFAULT_ORDER);

  columns: TableColumn<AdminBannerListItem>[] = [
    {
      key: 'imageUrl',
      label: 'Imagen',
      type: 'image',
      width: '88px',
      imageSize: 'md',
    },
    {
      key: 'title',
      label: 'Titulo',
      sortable: true,
      minWidth: '180px',
    },
    {
      key: 'description',
      label: 'Descripcion',
      minWidth: '240px',
      format: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'ctaLabel',
      label: 'CTA',
      minWidth: '150px',
      format: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'order',
      label: 'Orden',
      sortable: true,
      width: '80px',
      align: 'center',
    },
    {
      key: 'startsAt',
      label: 'Inicio',
      sortable: true,
      minWidth: '136px',
      align: 'center',
      format: (value) => (value ? String(localeDate.transform(value, 'short')) : '—'),
      cellClass: (_value, row) => this.getScheduleDateClass(row),
      hideBelow: 'lg',
    },
    {
      key: 'startsAt',
      label: 'Vigencia',
      type: 'badge',
      width: '116px',
      align: 'center',
      badgeFn: (_value, row) => this.getScheduleBadge(row),
    },
    {
      key: 'endsAt',
      label: 'Fin',
      sortable: true,
      minWidth: '136px',
      align: 'center',
      format: (value) => (value ? String(localeDate.transform(value, 'short')) : '—'),
      cellClass: (_value, row) => this.getScheduleDateClass(row),
      hideBelow: 'lg',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: '96px',
      align: 'center',
      badgeMap: {
        active: { label: 'Activo', variant: 'success' },
        inactive: { label: 'Inactivo', variant: 'warning' },
      },
    },
    {
      key: 'createdAt',
      label: 'Creado',
      sortable: true,
      width: '128px',
      align: 'center',
      pipe: localeDate,
      pipeArgs: ['short'],
      hideBelow: 'lg',
    },
  ];

  readonly tableCrud = {
    view: {
      permission: PERMISSIONS.BANNERS.READ,
      onClick: (banner: AdminBannerListItem) => this.viewBanner(banner),
    },
    edit: {
      permission: PERMISSIONS.BANNERS.UPDATE,
      show: (banner: AdminBannerListItem) => !banner.deletedAt,
      onClick: (banner: AdminBannerListItem) => this.editBanner(banner),
    },
    delete: {
      permission: PERMISSIONS.BANNERS.DELETE,
      show: (banner: AdminBannerListItem) => !banner.deletedAt,
      onClick: (banner: AdminBannerListItem) => this.deleteBanner(banner),
    },
  };

  readonly reorderActions = computed<TableAction<AdminBannerListItem>[]>(() => {
    if (!this.reorderMode()) return [];

    return [
      {
        icon: 'chevron_left',
        label: 'Enviar a pagina anterior',
        class: 'action-btn--secondary',
        show: (banner) => this.canMoveToPreviousPage(banner),
        callback: (banner) => this.moveToPreviousPage(banner),
      },
      {
        icon: 'chevron_right',
        label: 'Enviar a pagina siguiente',
        class: 'action-btn--secondary',
        show: (banner) => this.canMoveToNextPage(banner),
        callback: (banner) => this.moveToNextPage(banner),
      },
    ];
  });

  requestParams$ = toObservable(
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
        sortBy?: BannerSortBy;
        order?: 'ASC' | 'DESC';
          status?: BannerStatus;
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
            this.error.set(
              err?.error?.message ?? err?.message ?? 'Error al cargar banners',
            );
            return of(EMPTY_RESPONSE);
          }),
        );
    }),
  );

  response = toSignal(this.requestParams$, { initialValue: EMPTY_RESPONSE });

  data = computed(() => this.response().data);
  meta = computed<TableMeta>(() => toListMeta(this.response().meta));
  tableData = computed(() => {
    const draft = this.reorderDraft();
    if (this.reorderMode() && draft) {
      const start = toApiOffset(this.page(), this.limit());
      return draft.slice(start, start + this.limit());
    }

    return this.data();
  });

  canStartReorder = computed(() => {
    const meta = this.response().meta;
    const hasAllRowsVisible = meta.total <= meta.limit && this.data().length === meta.total;

    return (
      !this.loading() &&
      !this.preparingReorder() &&
      !this.reordering() &&
      !this.search() &&
      !this.statusFilter() &&
      !this.showDeleted() &&
      this.effectiveSortBy() === 'order' &&
      this.effectiveOrder() === 'ASC' &&
      meta.total > 1 &&
      (hasAllRowsVisible || meta.total > meta.limit)
    );
  });

  canSaveReorder = computed(() => {
    const draft = this.reorderDraft();
    const baseline = this.reorderBaseline();
    if (!this.reorderMode() || !draft || !baseline || draft.length !== baseline.length) return false;

    return draft.some((item, index) => item.id !== baseline[index]);
  });

  reorderBlockedReason = computed(() => {
    const meta = this.response().meta;

    if (this.showDeleted()) return 'Oculta los eliminados para reordenar.';
    if (this.search()) return 'Limpia la búsqueda para reordenar.';
    if (this.statusFilter()) return 'Quita el filtro de estado para reordenar.';
    if (this.effectiveSortBy() !== 'order' || this.effectiveOrder() !== 'ASC') {
      return 'Ordena por la columna Orden en ascendente para reordenar.';
    }
    if (meta.total <= 1) return 'Se necesitan al menos dos banners para reordenar.';

    return null;
  });

  hasActiveFilters = computed(
    () =>
      !!this.search() ||
      !!this.sortBy() ||
      !!this.statusFilter() ||
      this.showDeleted(),
  );

  activeFilterCount = computed(() => {
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

  onCreateBanner(): void {
    this.router.navigate(['/admin/banners/crear'], {
      queryParams: this.queryParams(),
    });
  }

  async startReorderMode(): Promise<void> {
    if (!this.canStartReorder()) return;

    this.preparingReorder.set(true);
    this.error.set(null);

    try {
      const allBanners = await this.loadAllBannersForReorder();
      this.reorderDraft.set(allBanners);
      this.reorderBaseline.set(allBanners.map((banner) => banner.id));
      this.reorderMode.set(true);
    } catch (err) {
      const error = err as { error?: { message?: string }; message?: string };
      this.error.set(error?.error?.message ?? error?.message ?? 'No se pudo iniciar el reordenamiento de banners');
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

    this.service.reorder({ bannerIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.reordering.set(false);
        this.cancelReorderMode();
        this.toastService.success('Orden actualizado', 'Los banners fueron reordenados correctamente.');
        this.refreshTick.update((value) => value + 1);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.reordering.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo reordenar banners');
      },
    });
  }

  onRowReorder(event: { fromIndex: number; toIndex: number; row: AdminBannerListItem }): void {
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

  moveToPreviousPage(banner: AdminBannerListItem): void {
    const draft = this.reorderDraft();
    if (!draft) return;

    const fromIndex = draft.findIndex((item) => item.id === banner.id);
    const targetIndex = Math.max(this.currentPageStartIndex() - 1, 0);
    if (fromIndex < 0 || fromIndex === targetIndex) return;

    this.reorderDraft.set(this.moveDraftItemAcrossPages(draft, fromIndex, targetIndex));
    this.goToReorderPage(this.page() - 1);
  }

  moveToNextPage(banner: AdminBannerListItem): void {
    const draft = this.reorderDraft();
    if (!draft) return;

    const fromIndex = draft.findIndex((item) => item.id === banner.id);
    const targetIndex = Math.min(this.currentPageStartIndex() + this.limit(), draft.length);
    if (fromIndex < 0 || fromIndex === targetIndex) return;

    this.reorderDraft.set(this.moveDraftItemAcrossPages(draft, fromIndex, targetIndex));
    this.goToReorderPage(this.page() + 1);
  }

  private getScheduleBadge(row: AdminBannerListItem): {
    label: string;
    variant: 'success' | 'danger' | 'info';
  } {
    const now = Date.now();
    const startsAt = row.startsAt ? new Date(row.startsAt).getTime() : null;
    const endsAt = row.endsAt ? new Date(row.endsAt).getTime() : null;

    if (startsAt && startsAt > now) {
      return { label: 'Próximo', variant: 'info' };
    }

    if (endsAt && endsAt < now) {
      return { label: 'Vencido', variant: 'danger' };
    }

    return { label: 'Vigente', variant: 'success' };
  }

  private getScheduleDateClass(row: AdminBannerListItem): string {
    return `banner-schedule-date banner-schedule-date--${this.getScheduleBadge(row).variant}`;
  }

  private viewBanner(banner: AdminBannerListItem): void {
    this.router.navigate(['/admin/banners', banner.id], {
      queryParams: this.queryParams(),
    });
  }

  private editBanner(banner: AdminBannerListItem): void {
    this.router.navigate(['/admin/banners', banner.id, 'editar'], {
      queryParams: this.queryParams(),
    });
  }

  private deleteBanner(banner: AdminBannerListItem): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Banner',
        message: `¿Estás seguro de eliminar el banner "${banner.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (confirmed) {
          this.service.delete(banner.id).subscribe({
            next: (result) => {
              this.toastService.success('Banner eliminado', result.message);
              this.refreshTick.update((value) => value + 1);
            },
            error: (err: { error?: { message?: string }; message?: string }) => {
              this.error.set(
                err?.error?.message ?? err?.message ?? 'Error al eliminar banner',
              );
            },
          });
        }
      });
  }

  private async loadAllBannersForReorder(): Promise<AdminBannerListItem[]> {
    const total = Math.max(this.response().meta.total, this.data().length, this.limit());
    const response = await firstValueFrom(
      this.service.findAll({
        limit: total,
        offset: 0,
        sortBy: 'order',
        order: 'ASC',
      }),
    );

    return response.data;
  }

  private canMoveToPreviousPage(banner: AdminBannerListItem): boolean {
    const draft = this.reorderDraft();
    if (!this.reorderMode() || !draft || this.page() <= 1) return false;

    return draft.findIndex((item) => item.id === banner.id) >= this.currentPageStartIndex();
  }

  private canMoveToNextPage(_banner: AdminBannerListItem): boolean {
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
    draft: AdminBannerListItem[],
    fromIndex: number,
    targetIndex: number,
  ): AdminBannerListItem[] {
    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) return draft;

    const normalizedTarget = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    nextDraft.splice(normalizedTarget, 0, moved);
    return nextDraft;
  }

  private moveDraftItemAcrossPages(
    draft: AdminBannerListItem[],
    fromIndex: number,
    targetIndex: number,
  ): AdminBannerListItem[] {
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

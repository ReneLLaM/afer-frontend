import {
  Component,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, of, distinctUntilChanged } from 'rxjs';
import {
  DataTableComponent,
  type TableMeta,
  type SortEvent,
} from '../../../../../shared/components/data-table/data-table';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { AdminListToolbarComponent } from '../../../../../shared/components/admin-list-toolbar/admin-list-toolbar';
import { TableFilterSelectComponent } from '../../../../../shared/components/table-filter-select/table-filter-select';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { AdminPermissionsService } from '../../../services/admin-permissions.service';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { PERMISSIONS, PermissionAction, PermissionModule } from '../../../../../core/constants/permissions';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../../../../shared/utils/list-query.utils';
import { toListMeta } from '../../../../../shared/models/list-meta.model';
import { PERMISSION_TABLE_COLUMNS } from '../../../../../shared/config/table-columns/permission.columns';
import type { Permission } from '../../../interfaces/admin-permission.interface';

const DEFAULT_SORT_BY = 'module';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'ASC';

interface PermissionsData {
  data: Permission[];
  meta: { total: number; limit: number; offset: number; page: number; totalPages: number };
}

const EMPTY_RESPONSE: PermissionsData = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'permissions-page',
  standalone: true,
  imports: [
    DataTableComponent,
    PaginationComponent,
    Breadcrumb,
    AdminListToolbarComponent,
    TableFilterSelectComponent,
    HasPermissionDirective,
  ],
  templateUrl: './permissions.html',
  styleUrl: './permissions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminPermissionsService);
  private readonly dialogService = inject(DialogService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly columns = PERMISSION_TABLE_COLUMNS;

  readonly moduleOptions = [
    { value: PermissionModule.PRODUCTS, label: 'Productos' },
    { value: PermissionModule.CATEGORIES, label: 'Categorías' },
    { value: PermissionModule.BRANDS, label: 'Marcas' },
    { value: PermissionModule.USERS, label: 'Usuarios' },
    { value: PermissionModule.ROLES, label: 'Roles' },
    { value: PermissionModule.PERMISSIONS, label: 'Permisos' },
    { value: PermissionModule.BANNERS, label: 'Banners' },
  ];

  readonly actionOptions = Object.values(PermissionAction).map((a) => ({
    value: a,
    label: a.replace('_', ' '),
  }));

  queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  listParams = computed(() => readListParams(this.queryParams()));

  page = computed(() => this.listParams().page);
  limit = computed(() => this.listParams().limit);
  search = computed(() => this.listParams().search);
  sortBy = computed(() => this.listParams().sortBy);
  order = computed(() => this.listParams().order);
  moduleFilter = computed(() => String(this.listParams()['module'] ?? ''));
  actionFilter = computed(() => String(this.listParams()['action'] ?? ''));

  sortDirection = computed(() => sortDirectionFromOrder(this.order()));

  readonly tableCrud = {
    view: {
      permission: PERMISSIONS.PERMISSIONS.READ,
      onClick: (p: Permission) =>
        this.router.navigate(['/admin/permisos', p.slug], { queryParamsHandling: 'preserve' }),
    },
  };

  loading = signal(false);
  error = signal<string | null>(null);

  requestParams$ = toObservable(
    computed(() =>
      JSON.stringify({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        module: this.moduleFilter() || undefined,
        action: this.actionFilter() || undefined,
        sortBy: this.sortBy() || undefined,
        order: this.order() || undefined,
      }),
    ),
  ).pipe(
    distinctUntilChanged(),
    switchMap((paramsJson) => {
      const parsed = JSON.parse(paramsJson);
      const params = {
        limit: parsed.limit,
        offset: toApiOffset(parsed.page, parsed.limit),
        search: parsed.search,
        module: parsed.module,
        action: parsed.action,
        sortBy: parsed.sortBy || DEFAULT_SORT_BY,
        order: (parsed.order || DEFAULT_ORDER) as 'ASC' | 'DESC',
      };
      this.loading.set(true);
      this.error.set(null);
      return this.service.findAll(params).pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.message ?? 'Error al cargar permisos');
          return of(EMPTY_RESPONSE);
        }),
      );
    }),
  );

  response = toSignal(this.requestParams$, { initialValue: EMPTY_RESPONSE });

  data = computed(() => this.response().data);
  meta = computed<TableMeta>(() => toListMeta(this.response().meta));

  hasActiveFilters = computed(
    () =>
      !!this.search() ||
      !!this.sortBy() ||
      !!this.moduleFilter() ||
      !!this.actionFilter(),
  );

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.search()) n++;
    if (this.sortBy()) n++;
    if (this.moduleFilter()) n++;
    if (this.actionFilter()) n++;
    return n;
  });

  private navigateQuery(patch: Record<string, string | number | null | undefined>): void {
    const nextQuery = buildListQueryPatch(this.queryParams(), patch);
    const currentQuery = buildListQueryPatch(this.queryParams(), {});

    if (areSameQueryParams(currentQuery, nextQuery)) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: nextQuery,
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }

  onSearch(value: string): void {
    this.navigateQuery({ search: value, page: 1 });
  }

  onModuleFilter(value: string): void {
    this.navigateQuery({ module: value || null, page: 1 });
  }

  onActionFilter(value: string): void {
    this.navigateQuery({ action: value || null, page: 1 });
  }

  onSort(event: SortEvent): void {
    if (!event.direction) {
      this.navigateQuery({ sortBy: null, order: null });
    } else {
      this.navigateQuery({
        sortBy: event.key,
        order: event.direction === 'asc' ? 'ASC' : 'DESC',
      });
    }
  }

  onPageChange(newPage: number): void {
    this.navigateQuery({ page: newPage });
  }

  onLimitChange(newLimit: number): void {
    this.navigateQuery({ limit: newLimit, page: 1 });
  }

  onClearFilters(): void {
    this.navigateQuery({
      search: null,
      module: null,
      action: null,
      sortBy: null,
      order: null,
    });
  }

  async onSeedPermissions(): Promise<void> {
    const confirm = await this.dialogService.confirm({
      title: 'Sincronizar Permisos',
      message:
        '¿Estás seguro de sincronizar los permisos? Esto actualizará la base de datos con las constantes del backend.',
      confirmText: 'Sincronizar ahora',
      type: 'confirm',
    });

    if (!confirm) return;

    this.loading.set(true);
    this.service.seed().subscribe({
      next: () => {
        this.loading.set(false);
        this.navigateQuery({ page: 1 });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Error al ejecutar seed');
      },
    });
  }
}

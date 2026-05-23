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
  DataTable,
  type TableColumn,
  type TableMeta,
  type SortEvent,
} from '../../../components/admin-data-table/admin-data-table';
import { Pagination } from '../../../../../shared/components/pagination/pagination';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { AdminListToolbar } from '../../../components/admin-list-toolbar/admin-list-toolbar';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AdminRolesService } from '../../../services/admin-roles.service';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../../utils/admin-list-query.utils';
import { toListMeta } from '../../../../../shared/interfaces/list-meta.interface';
import type { Role, RolesResponse } from '../../../interfaces/admin-role.interface';

const DEFAULT_SORT_BY = 'name';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'ASC';

const EMPTY_RESPONSE: RolesResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'roles-page',
  standalone: true,
  imports: [
    DataTable,
    Pagination,
    Breadcrumb,
    AdminListToolbar,
    HasPermissionDirective,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminRolesService);
  private readonly dialogService = inject(DialogService);

  readonly PERMISSIONS = PERMISSIONS;

  queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  listParams = computed(() => readListParams(this.queryParams()));
  page = computed(() => this.listParams().page);
  limit = computed(() => this.listParams().limit);
  search = computed(() => this.listParams().search);
  sortBy = computed(() => this.listParams().sortBy);
  order = computed(() => this.listParams().order);
  sortDirection = computed(() => sortDirectionFromOrder(this.order()));

  columns: TableColumn<Role>[] = [
    { key: 'name', label: 'Nombre', sortable: true, minWidth: '120px' },
    { key: 'slug', label: 'Slug', sortable: true, minWidth: '160px' },
    {
      key: 'description',
      label: 'Descripción',
      minWidth: '200px',
      format: (v) => (v ? String(v) : '—'),
      hideBelow: 'sm',
    },
    { key: 'isSystem', label: 'Sistema', type: 'boolean', width: '100px', align: 'center' },
  ];

  readonly tableCrud = {
    view: {
      permission: PERMISSIONS.ROLES.READ,
      onClick: (r: Role) => this.viewRole(r),
    },
    edit: {
      permission: PERMISSIONS.ROLES.UPDATE,
      show: (r: Role) => !r.isSystem,
      onClick: (r: Role) => this.editRole(r),
    },
    delete: {
      permission: PERMISSIONS.ROLES.DELETE,
      show: (r: Role) => !r.isSystem,
      onClick: (r: Role) => this.deleteRole(r),
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
        sortBy: parsed.sortBy || DEFAULT_SORT_BY,
        order: (parsed.order || DEFAULT_ORDER) as 'ASC' | 'DESC',
      };
      this.loading.set(true);
      this.error.set(null);
      return this.service.findAll(params).pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.message ?? 'Error al cargar roles');
          return of(EMPTY_RESPONSE);
        }),
      );
    }),
  );

  response = toSignal(this.requestParams$, { initialValue: EMPTY_RESPONSE });

  data = computed(() => this.response().data);
  meta = computed<TableMeta>(() => toListMeta(this.response().meta));

  hasActiveFilters = computed(() => !!this.search() || !!this.sortBy());
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.search()) n++;
    if (this.sortBy()) n++;
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

  onSort(event: SortEvent): void {
    this.navigateQuery({
      sortBy: event.direction ? event.key : null,
      order: event.direction ? event.direction.toUpperCase() : null,
    });
  }

  onPageChange(page: number): void {
    this.navigateQuery({ page });
  }

  onLimitChange(limit: number): void {
    this.navigateQuery({ limit, page: 1 });
  }

  onClearFilters(): void {
    this.navigateQuery({ search: null, sortBy: null, order: null });
  }

  onSeedRoles(): void {
    this.dialogService
      .confirm({
        title: 'Sincronizar Roles',
        message:
          '¿Estás seguro de sincronizar los roles del sistema? Esto actualizará los permisos de los roles base.',
        confirmText: 'Sincronizar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (confirmed) {
          this.loading.set(true);
          this.service.seed().subscribe({
            next: () => {
              this.loading.set(false);
              this.navigateQuery({ page: this.page() });
            },
            error: (err) => {
              this.loading.set(false);
              this.error.set(err.message || 'Error al sincronizar roles');
            },
          });
        }
      });
  }

  private viewRole(role: Role): void {
    this.dialogService.confirm({
      title: `Detalle: ${role.name}`,
      message: `Slug: ${role.slug}\n\nDescripción: ${role.description || 'Sin descripción'}`,
      confirmText: 'Cerrar',
      type: 'confirm',
    });
  }

  private editRole(role: Role): void {
    console.log('Editar rol', role);
  }

  private deleteRole(role: Role): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Rol',
        message: `¿Estás seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (confirmed) {
          this.service.delete(role.id).subscribe({
            next: () => this.navigateQuery({ page: this.page() }),
            error: (err) => this.error.set(err.message || 'Error al eliminar rol'),
          });
        }
      });
  }
}

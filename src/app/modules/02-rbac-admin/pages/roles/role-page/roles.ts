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
import { ToastService } from '../../../../../shared/services/toast.service';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../../utils/admin-list-query.utils';
import { toListMeta } from '../../../../../shared/interfaces/list-meta.interface';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import type { AdminRoleListItem, AdminRolesResponse } from '../../../interfaces/admin-role.interface';

const DEFAULT_SORT_BY = 'name';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'ASC';
const localeDate = new LocaleDatePipe();

const EMPTY_RESPONSE: AdminRolesResponse = {
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
  private readonly toastService = inject(ToastService);

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
  roleTypeFilter = computed<'all' | 'system' | 'user'>(() => {
    const value = this.queryParams()['roleType'];
    return value === 'system' || value === 'user' ? value : 'all';
  });
  showDeleted = computed(() => this.queryParams()['showDeleted'] === 'true');
  sortDirection = computed(() => sortDirectionFromOrder(this.order()));

  columns: TableColumn<AdminRoleListItem>[] = [
    { key: 'name', label: 'Nombre', sortable: true, minWidth: '160px' },
    { key: 'slug', label: 'Slug', sortable: true, minWidth: '160px' },
    {
      key: 'description',
      label: 'Descripción',
      minWidth: '240px',
      format: (v) => (v ? String(v) : '—'),
    },
    {
      key: 'permissions',
      label: 'Permisos',
      width: '110px',
      align: 'center',
      format: (value) => `${Array.isArray(value) ? value.length : 0}`,
    },
    { key: 'isSystem', label: 'Sistema', type: 'boolean', width: '100px', align: 'center' },
    {
      key: 'audit',
      label: 'Creado por',
      minWidth: '180px',
      format: (_value, row) => row.audit.createdBy?.fullName || 'Sistema',
    },
    {
      key: 'createdAt',
      label: 'Creado',
      sortable: true,
      width: '118px',
      pipe: localeDate,
      pipeArgs: ['short'],
    },
  ];

  readonly tableCrud = {
    view: {
      permission: PERMISSIONS.ROLES.READ,
      onClick: (r: AdminRoleListItem) => this.viewRole(r),
    },
    edit: {
      permission: PERMISSIONS.ROLES.UPDATE,
      show: (r: AdminRoleListItem) => !r.isSystem && !r.deletedAt,
      onClick: (r: AdminRoleListItem) => this.editRole(r),
    },
    delete: {
      permission: PERMISSIONS.ROLES.DELETE,
      show: (r: AdminRoleListItem) => !r.isSystem && !r.deletedAt,
      onClick: (r: AdminRoleListItem) => this.deleteRole(r),
    },
  };

  loading = signal(false);
  error = signal<string | null>(null);
  refreshTick = signal(0);

  requestParams$ = toObservable(
    computed(() =>
      JSON.stringify({
        page: this.page(),
        limit: this.limit(),
        refreshTick: this.refreshTick(),
        search: this.search() || undefined,
        roleType: this.roleTypeFilter() !== 'all' ? this.roleTypeFilter() : undefined,
        showDeleted: this.showDeleted() ? 'true' : undefined,
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
        roleType:
          parsed.roleType === 'system' || parsed.roleType === 'user'
            ? parsed.roleType
            : undefined,
        showDeleted: parsed.showDeleted === 'true' ? true : undefined,
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

  hasActiveFilters = computed(
    () => !!this.search() || !!this.sortBy() || this.roleTypeFilter() !== 'all' || this.showDeleted(),
  );
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.search()) n++;
    if (this.sortBy()) n++;
    if (this.roleTypeFilter() !== 'all') n++;
    if (this.showDeleted()) n++;
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

  onCreateRole(): void {
    this.router.navigate(['/admin/roles/crear'], {
      queryParams: this.queryParams(),
    });
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

  onRoleTypeFilter(value: 'all' | 'system' | 'user'): void {
    this.navigateQuery({ roleType: value === 'all' ? null : value, page: 1 });
  }

  onShowDeletedChange(checked: boolean): void {
    this.navigateQuery({ showDeleted: checked ? 'true' : null, page: 1 });
  }

  onClearFilters(): void {
    this.navigateQuery({ search: null, sortBy: null, order: null, roleType: null, showDeleted: null });
  }

  private refreshList(): void {
    this.refreshTick.update((value) => value + 1);
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
              this.toastService.success('Roles sincronizados', 'Los roles base fueron actualizados correctamente.');
              this.refreshList();
            },
            error: (err) => {
              this.loading.set(false);
              this.error.set(err.message || 'Error al sincronizar roles');
            },
          });
        }
      });
  }

  private viewRole(role: AdminRoleListItem): void {
    this.router.navigate(['/admin/roles', role.id], {
      queryParams: this.queryParams(),
    });
  }

  private editRole(role: AdminRoleListItem): void {
    this.router.navigate(['/admin/roles', role.id, 'editar'], {
      queryParams: {
        ...this.queryParams(),
        returnTo: 'list',
      },
    });
  }

  private deleteRole(role: AdminRoleListItem): void {
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
            next: () => {
              this.toastService.success('Rol eliminado', `El rol "${role.name}" fue eliminado correctamente.`);
              this.refreshList();
            },
            error: (err) => this.error.set(err.message || 'Error al eliminar rol'),
          });
        }
      });
  }
}

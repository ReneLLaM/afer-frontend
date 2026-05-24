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
} from '../../components/admin-data-table/admin-data-table';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Breadcrumb } from '../../../../shared/components/breadcrumb/breadcrumb';
import { AdminListToolbar } from '../../components/admin-list-toolbar/admin-list-toolbar';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminRolesService } from '../../services/admin-roles.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PERMISSIONS } from '../../../../core/constants/permissions';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../utils/admin-list-query.utils';
import { toListMeta } from '../../../../shared/interfaces/list-meta.interface';
import { LocaleDatePipe } from '../../../../shared/pipes/locale-date.pipe';
import type {
  User,
  UserSortBy,
  UserStatus,
  UsersResponse,
} from '../../interfaces/admin-user.interface';
import type { AdminRoleListItem, AdminRolesResponse } from '../../interfaces/admin-role.interface';

const DEFAULT_SORT_BY: UserSortBy = 'createdAt';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'DESC';
const localeDate = new LocaleDatePipe();
const EMPTY_ROLES_RESPONSE: AdminRolesResponse = {
  data: [],
  meta: { total: 0, limit: 100, offset: 0, page: 1, totalPages: 1 },
};

const EMPTY_RESPONSE: UsersResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'users-page',
  standalone: true,
  imports: [
    DataTable,
    Pagination,
    Breadcrumb,
    AdminListToolbar,
    HasPermissionDirective,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminUsersService);
  private readonly rolesService = inject(AdminRolesService);
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
  statusFilter = computed<UserStatus | ''>(() => {
    const value = this.queryParams()['status'];
    return value === 'active' || value === 'inactive' || value === 'blocked' ? value : '';
  });
  roleIdFilter = computed(() => {
    const value = this.queryParams()['roleId'];
    return typeof value === 'string' ? value : '';
  });
  showDeleted = computed(() => this.queryParams()['showDeleted'] === 'true');
  sortDirection = computed(() => sortDirectionFromOrder(this.order()));

  columns: TableColumn<User>[] = [
    { key: 'email', label: 'Email', sortable: true, minWidth: '180px' },
    { key: 'fullName', label: 'Nombre completo', sortable: true, minWidth: '180px' },
    {
      key: 'gender',
      label: 'Genero',
      sortable: true,
      width: '120px',
      type: 'badge',
      badgeFn: (value) => {
        if (value === 'male') return { label: 'Masculino', variant: 'primary' as const };
        if (value === 'female') return { label: 'Femenino', variant: 'success' as const };
        if (value === 'undefined') return { label: 'No definido', variant: 'warning' as const };
        return { label: 'No registrado', variant: 'neutral' as const };
      },
    },
    {
      key: 'roles',
      label: 'Roles',
      minWidth: '180px',
      format: (value) =>
        Array.isArray(value) && value.length > 0
          ? value.map((role) => (role as User['roles'][number]).name).join(', ')
          : 'Sin roles',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: '120px',
      badgeMap: {
        active: { label: 'Activo', variant: 'success' },
        inactive: { label: 'Inactivo', variant: 'warning' },
        blocked: { label: 'Bloqueado', variant: 'danger' },
      },
    },
    {
      key: 'emailVerified',
      label: 'Email',
      type: 'badge',
      width: '110px',
      badgeMap: {
        true: { label: 'Verificado', variant: 'success' },
        false: { label: 'Pendiente', variant: 'warning' },
      },
    },
    {
      key: 'lastLoginAt',
      label: 'Ultimo acceso',
      sortable: true,
      width: '140px',
      format: (value) => (value ? String(localeDate.transform(value, 'short')) : 'Nunca'),
      hideBelow: 'lg',
    },
    {
      key: 'createdAt',
      label: 'Registro',
      sortable: true,
      width: '120px',
      pipe: localeDate,
      pipeArgs: ['short'],
      hideBelow: 'lg',
    },
  ];

  readonly tableCrud = {
    view: {
      permission: PERMISSIONS.USERS.READ,
      onClick: (u: User) => this.viewUser(u),
    },
    edit: {
      permission: PERMISSIONS.USERS.UPDATE,
      show: (u: User) => !u.deletedAt,
      onClick: (u: User) => this.editUser(u),
    },
    delete: {
      permission: PERMISSIONS.USERS.DELETE,
      show: (u: User) => !u.deletedAt,
      onClick: (u: User) => this.deleteUser(u),
    },
  };

  loading = signal(false);
  error = signal<string | null>(null);
  refreshTick = signal(0);

  readonly statusOptions: Array<{ value: UserStatus; label: string }> = [
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'blocked', label: 'Bloqueados' },
  ];

  readonly roleOptions = toSignal(
    this.rolesService.findAll({ limit: 100, offset: 0, sortBy: 'name', order: 'ASC' }).pipe(
      catchError(() => of(EMPTY_ROLES_RESPONSE)),
    ),
    { initialValue: EMPTY_ROLES_RESPONSE },
  );

  requestParams$ = toObservable(
    computed(() =>
      JSON.stringify({
        page: this.page(),
        limit: this.limit(),
        refreshTick: this.refreshTick(),
        search: this.search() || undefined,
        status: this.statusFilter() || undefined,
        roleId: this.roleIdFilter() || undefined,
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
        status: parsed.status as UserStatus | undefined,
        roleId: parsed.roleId,
        showDeleted: parsed.showDeleted === 'true' ? true : undefined,
        sortBy: (parsed.sortBy || DEFAULT_SORT_BY) as UserSortBy,
        order: (parsed.order || DEFAULT_ORDER) as 'ASC' | 'DESC',
      };
      this.loading.set(true);
      this.error.set(null);
      return this.service.findAll(params).pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.message ?? 'Error al cargar usuarios');
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
      !!this.statusFilter() ||
      !!this.roleIdFilter() ||
      this.showDeleted(),
  );
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.search()) n++;
    if (this.sortBy()) n++;
    if (this.statusFilter()) n++;
    if (this.roleIdFilter()) n++;
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

  onCreateUser(): void {
    this.router.navigate(['/admin/usuarios/crear'], {
      queryParams: this.queryParams(),
    });
  }

  onStatusFilter(value: string): void {
    this.navigateQuery({ status: value || null, page: 1 });
  }

  onRoleFilter(value: string): void {
    this.navigateQuery({ roleId: value || null, page: 1 });
  }

  onShowDeletedChange(checked: boolean): void {
    this.navigateQuery({ showDeleted: checked ? 'true' : null, page: 1 });
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
    this.navigateQuery({
      search: null,
      status: null,
      roleId: null,
      showDeleted: null,
      sortBy: null,
      order: null,
      page: 1,
    });
  }

  private viewUser(user: User): void {
    this.router.navigate(['/admin/usuarios', user.id], {
      queryParams: this.queryParams(),
    });
  }

  private editUser(user: User): void {
    this.router.navigate(['/admin/usuarios', user.id, 'editar'], {
      queryParams: this.queryParams(),
    });
  }

  private deleteUser(user: User): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Usuario',
        message: `¿Estás seguro de eliminar al usuario "${user.email}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (confirmed) {
          this.service.delete(user.id).subscribe({
            next: (result) => {
              this.toastService.success('Usuario eliminado', result.message);
              this.refreshTick.update((value) => value + 1);
            },
            error: (err) => this.error.set(err.message || 'Error al eliminar usuario'),
          });
        }
      });
  }
}

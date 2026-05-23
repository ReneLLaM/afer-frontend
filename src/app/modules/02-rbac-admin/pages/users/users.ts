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
  type TableColumn,
  type TableMeta,
  type SortEvent,
} from '../../../../shared/components/data-table/data-table';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { Breadcrumb } from '../../../../shared/components/breadcrumb/breadcrumb';
import { AdminListToolbarComponent } from '../../../../shared/components/admin-list-toolbar/admin-list-toolbar';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AdminUsersService } from '../../services/admin-users.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { PERMISSIONS } from '../../../../core/constants/permissions';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../../../shared/utils/list-query.utils';
import { toListMeta } from '../../../../shared/models/list-meta.model';
import { LocaleDatePipe } from '../../../../shared/pipes/locale-date.pipe';
import type { User, UsersResponse } from '../../interfaces/admin-user.interface';

const DEFAULT_SORT_BY = 'email';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'ASC';
const localeDate = new LocaleDatePipe();

const EMPTY_RESPONSE: UsersResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

@Component({
  selector: 'users-page',
  standalone: true,
  imports: [
    DataTableComponent,
    PaginationComponent,
    Breadcrumb,
    AdminListToolbarComponent,
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

  columns: TableColumn<User>[] = [
    { key: 'email', label: 'Email', sortable: true, minWidth: '180px' },
    { key: 'firstName', label: 'Nombre', sortable: true },
    { key: 'lastName', label: 'Apellido', sortable: true, hideBelow: 'md' },
    { key: 'isActive', label: 'Activo', type: 'boolean', width: '90px', align: 'center' },
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
      onClick: (u: User) => this.editUser(u),
    },
    delete: {
      permission: PERMISSIONS.USERS.DELETE,
      onClick: (u: User) => this.deleteUser(u),
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
          this.error.set(err.message ?? 'Error al cargar usuarios');
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

  private viewUser(user: User): void {
    this.dialogService.confirm({
      title: `Detalle: ${user.firstName} ${user.lastName}`,
      message: `Email: ${user.email}\nEstado: ${user.isActive ? 'Activo' : 'Inactivo'}\nRegistro: ${localeDate.transform(user.createdAt, 'medium')}`,
      confirmText: 'Cerrar',
      type: 'confirm',
    });
  }

  private editUser(user: User): void {
    console.log('Editar usuario', user);
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
            next: () => this.navigateQuery({ page: this.page() }),
            error: (err) => this.error.set(err.message || 'Error al eliminar usuario'),
          });
        }
      });
  }
}

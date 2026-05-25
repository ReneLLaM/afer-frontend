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
import {
  Observable,
  catchError,
  distinctUntilChanged,
  firstValueFrom,
  from,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  DataTable,
  type SortEvent,
  type TableColumn,
  type TableMeta,
} from '../../components/admin-data-table/admin-data-table';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Breadcrumb } from '../../../../shared/components/breadcrumb/breadcrumb';
import { AdminListToolbar } from '../../components/admin-list-toolbar/admin-list-toolbar';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LocaleDatePipe } from '../../../../shared/pipes/locale-date.pipe';
import { AdminProductsService } from '../../services/admin-products.service';
import { AdminBrandsService } from '../../services/admin-brands.service';
import { AdminCategoriesService } from '../../services/admin-categories.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import type {
  AdminProductListItem,
  AdminProductsResponse,
  ProductSortBy,
  ProductStatus,
} from '../../interfaces/admin-product.interface';
import type { AdminBrandListItem } from '../../interfaces/admin-brand.interface';
import type { AdminCategoryListItem } from '../../interfaces/admin-category.interface';
import {
  areSameQueryParams,
  buildListQueryPatch,
  readListParams,
  sortDirectionFromOrder,
  toApiOffset,
} from '../../utils/admin-list-query.utils';
import { toListMeta, type ApiListMeta } from '../../../../shared/interfaces/list-meta.interface';
import { PERMISSIONS } from '../../../../core/constants/permissions';

interface FilterOption {
  id: string;
  name: string;
  slug: string;
  label: string;
}

interface ProductFiltersData {
  brands: FilterOption[];
  categories: FilterOption[];
}

type ProductTableRow = AdminProductListItem & {
  brandName: string;
  categoriesLabel: string;
  primaryImageUrl: string;
};

const localeDate = new LocaleDatePipe();
const DEFAULT_SORT_BY: ProductSortBy = 'createdAt';
const DEFAULT_ORDER: 'ASC' | 'DESC' = 'DESC';
const PRODUCT_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';
const FILTERS_PAGE_SIZE = 200;

const EMPTY_RESPONSE: AdminProductsResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0, page: 1, totalPages: 1 },
};

const EMPTY_FILTERS: ProductFiltersData = {
  brands: [],
  categories: [],
};

const PRICE_FORMATTER = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Component({
  selector: 'products-admin-page',
  standalone: true,
  imports: [DataTable, Pagination, Breadcrumb, AdminListToolbar, HasPermissionDirective],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsAdminPage {
  readonly PERMISSIONS = PERMISSIONS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(AdminProductsService);
  private readonly brandsService = inject(AdminBrandsService);
  private readonly categoriesService = inject(AdminCategoriesService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(false);
  readonly filtersLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtersError = signal<string | null>(null);
  readonly refreshTick = signal(0);
  readonly productImageCell = viewChild.required<
    TemplateRef<{
      $implicit: unknown;
      row: ProductTableRow;
      col: TableColumn<ProductTableRow>;
    }>
  >('productImageCell');

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  readonly listParams = computed(() => readListParams(this.queryParams()));
  readonly page = computed(() => this.listParams().page);
  readonly limit = computed(() => this.listParams().limit);
  readonly search = computed(() => this.listParams().search);
  readonly sortBy = computed(() => this.listParams().sortBy);
  readonly order = computed(() => this.listParams().order);
  readonly statusFilter = computed<ProductStatus | ''>(() => {
    const value = this.queryParams()['status'];
    return value === 'active' || value === 'inactive' || value === 'deprecated' ? value : '';
  });
  readonly categoryIdFilter = computed(() => {
    const value = this.queryParams()['categoryId'];
    return typeof value === 'string' && value.trim() ? value : '';
  });
  readonly brandIdFilter = computed(() => {
    const value = this.queryParams()['brandId'];
    return typeof value === 'string' && value.trim() ? value : '';
  });
  readonly showDeleted = computed(() => this.queryParams()['showDeleted'] === 'true');
  readonly sortDirection = computed(() => sortDirectionFromOrder(this.order()));

  readonly filterOptions = toSignal(
    from(this.loadFilterOptions()).pipe(
      tap(() => {
        this.filtersLoading.set(false);
        this.filtersError.set(null);
      }),
      catchError((err: { error?: { message?: string }; message?: string }) => {
        this.filtersLoading.set(false);
        this.filtersError.set(
          err?.error?.message ?? err?.message ?? 'Error al cargar filtros de marcas y categorias',
        );
        return of(EMPTY_FILTERS);
      }),
    ),
    { initialValue: EMPTY_FILTERS },
  );

  readonly selectedCategoryOption = computed(() =>
    this.filterOptions().categories.find((option) => option.id === this.categoryIdFilter()) ?? null,
  );
  readonly selectedBrandOption = computed(() =>
    this.filterOptions().brands.find((option) => option.id === this.brandIdFilter()) ?? null,
  );

  readonly categoryFilterInput = linkedSignal(() => this.selectedCategoryOption()?.label ?? '');
  readonly brandFilterInput = linkedSignal(() => this.selectedBrandOption()?.label ?? '');

  readonly columns = computed<TableColumn<ProductTableRow>[]>(() => [
    {
      key: 'primaryImageUrl',
      label: 'Imagen',
      type: 'custom',
      width: '88px',
      align: 'center',
      template: this.productImageCell(),
    },
    {
      key: 'title',
      label: 'Producto',
      sortable: true,
      minWidth: '220px',
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      minWidth: '130px',
      hideBelow: 'md',
    },
    {
      key: 'brandName',
      label: 'Marca',
      minWidth: '170px',
      format: (value) => String(value || 'Sin marca'),
      hideBelow: 'md',
    },
    {
      key: 'categoriesLabel',
      label: 'Categorias',
      minWidth: '240px',
      wrap: true,
      format: (value) => String(value || 'Sin categorias'),
      hideBelow: 'lg',
    },
    {
      key: 'price',
      label: 'Precio',
      sortable: true,
      width: '120px',
      align: 'right',
      format: (value) => `Bs ${PRICE_FORMATTER.format(Number(value ?? 0))}`,
    },
    {
      key: 'currentStock',
      label: 'Stock',
      sortable: true,
      width: '86px',
      align: 'center',
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
          return { label: 'Eliminado', variant: 'neutral' };
        }

        switch (value) {
          case 'active':
            return { label: 'Activo', variant: 'success' };
          case 'inactive':
            return { label: 'Inactivo', variant: 'warning' };
          case 'deprecated':
            return { label: 'Deprecado', variant: 'danger' };
          default:
            return { label: String(value ?? '—'), variant: 'neutral' };
        }
      },
    },
    {
      key: 'createdAt',
      label: 'Creado',
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
      permission: PERMISSIONS.PRODUCTS.READ,
      onClick: (product: ProductTableRow) => this.viewProduct(product),
    },
    edit: {
      permission: PERMISSIONS.PRODUCTS.UPDATE,
      show: (product: ProductTableRow) => !product.deletedAt,
      onClick: (product: ProductTableRow) => this.editProduct(product),
    },
    delete: {
      permission: PERMISSIONS.PRODUCTS.DELETE,
      show: (product: ProductTableRow) => !product.deletedAt,
      onClick: (product: ProductTableRow) => this.deleteProduct(product),
    },
  };

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
        categoryId: this.categoryIdFilter() || undefined,
        brandId: this.brandIdFilter() || undefined,
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
        sortBy?: ProductSortBy;
        order?: 'ASC' | 'DESC';
        status?: ProductStatus;
        categoryId?: string;
        brandId?: string;
        showDeleted?: 'true';
      } = JSON.parse(paramsJson);

      this.loading.set(true);
      this.error.set(null);

      return this.productsService
        .findAll({
          limit: parsed.limit,
          offset: toApiOffset(parsed.page, parsed.limit),
          search: parsed.search,
          sortBy: parsed.sortBy || DEFAULT_SORT_BY,
          order: parsed.order || DEFAULT_ORDER,
          status: parsed.status,
          categoryId: parsed.categoryId,
          brandId: parsed.brandId,
          showDeleted: parsed.showDeleted === 'true' ? true : undefined,
        })
        .pipe(
          tap(() => {
            this.loading.set(false);
          }),
          catchError((err: { error?: { message?: string }; message?: string }) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'Error al cargar productos');
            return of(EMPTY_RESPONSE);
          }),
        );
    }),
  );

  readonly response = toSignal(this.requestParams$, { initialValue: EMPTY_RESPONSE });
  readonly meta = computed<TableMeta>(() => toListMeta(this.response().meta));
  readonly tableData = computed<ProductTableRow[]>(() =>
    this.response().data.map((product) => this.normalizeProductItem(product)),
  );

  readonly hasActiveFilters = computed(
    () =>
      !!this.search() ||
      !!this.sortBy() ||
      !!this.statusFilter() ||
      !!this.categoryIdFilter() ||
      !!this.brandIdFilter() ||
      this.showDeleted(),
  );

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.sortBy()) count++;
    if (this.statusFilter()) count++;
    if (this.categoryIdFilter()) count++;
    if (this.brandIdFilter()) count++;
    if (this.showDeleted()) count++;
    return count;
  });

  onSearch(value: string): void {
    void this.navigateQuery({ search: value, page: 1 });
  }

  onStatusFilter(value: string): void {
    void this.navigateQuery({ status: value || null, page: 1 });
  }

  onCategoryFilterInput(value: string): void {
    this.categoryFilterInput.set(value);

    const normalized = this.normalizeTerm(value);
    if (!normalized) {
      void this.navigateQuery({ categoryId: null, page: 1 });
      return;
    }

    const match = this.findExactFilterOption(this.filterOptions().categories, normalized);
    if (match) {
      void this.navigateQuery({ categoryId: match.id, page: 1 });
      return;
    }

    if (this.categoryIdFilter()) {
      void this.navigateQuery({ categoryId: null, page: 1 });
    }
  }

  onBrandFilterInput(value: string): void {
    this.brandFilterInput.set(value);

    const normalized = this.normalizeTerm(value);
    if (!normalized) {
      void this.navigateQuery({ brandId: null, page: 1 });
      return;
    }

    const match = this.findExactFilterOption(this.filterOptions().brands, normalized);
    if (match) {
      void this.navigateQuery({ brandId: match.id, page: 1 });
      return;
    }

    if (this.brandIdFilter()) {
      void this.navigateQuery({ brandId: null, page: 1 });
    }
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
    this.categoryFilterInput.set('');
    this.brandFilterInput.set('');

    void this.navigateQuery({
      search: null,
      sortBy: null,
      order: null,
      status: null,
      categoryId: null,
      brandId: null,
      showDeleted: null,
      page: 1,
    });
  }

  private async navigateQuery(
    patch: Record<string, string | number | null | undefined>,
  ): Promise<void> {
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

  private deleteProduct(product: ProductTableRow): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Producto',
        message: `¿Estas seguro de eliminar el producto "${product.title}"? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.productsService.delete(product.id).subscribe({
          next: () => {
            this.toastService.success(
              'Producto eliminado',
              `El producto "${product.title}" fue eliminado correctamente.`,
            );
            this.refreshTick.update((value) => value + 1);
          },
          error: (err: { error?: { message?: string }; message?: string }) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'Error al eliminar producto');
          },
        });
      });
  }

  private viewProduct(product: ProductTableRow): void {
    this.router.navigate(['/admin/productos', product.id], {
      queryParams: this.queryParams(),
    });
  }

  private editProduct(product: ProductTableRow): void {
    this.router.navigate(['/admin/productos', product.id, 'editar'], {
      queryParams: this.queryParams(),
    });
  }

  goToCreatePage(): void {
    this.router.navigate(['/admin/productos/crear'], {
      queryParamsHandling: 'preserve',
    });
  }

  private normalizeProductItem(product: AdminProductListItem): ProductTableRow {
    return {
      ...product,
      brandName: product.brand?.name ?? 'Sin marca',
      categoriesLabel: product.categories.map((category) => category.name).join(', '),
      primaryImageUrl: product.images[0]?.url || PRODUCT_IMAGE_PLACEHOLDER,
    };
  }

  private normalizeFilterOption(item: AdminBrandListItem | AdminCategoryListItem): FilterOption {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      label: `${item.name} (${item.slug})`,
    };
  }

  private findExactFilterOption(options: FilterOption[], normalizedValue: string): FilterOption | null {
    return (
      options.find((option) => {
        const normalizedLabel = this.normalizeTerm(option.label);
        const normalizedName = this.normalizeTerm(option.name);
        const normalizedSlug = this.normalizeTerm(option.slug);

        return (
          normalizedValue === normalizedLabel ||
          normalizedValue === normalizedName ||
          normalizedValue === normalizedSlug
        );
      }) ?? null
    );
  }

  private normalizeTerm(value: string): string {
    return value.trim().toLowerCase();
  }

  private async loadFilterOptions(): Promise<ProductFiltersData> {
    const [brands, categories] = await Promise.all([
      this.loadAllAdminBrands(),
      this.loadAllAdminCategories(),
    ]);

    return {
      brands,
      categories,
    };
  }

  private async loadAllAdminBrands(): Promise<FilterOption[]> {
    const brands = await this.collectAllPages<AdminBrandListItem>((offset, limit) =>
      this.brandsService.findAll({
        offset,
        limit,
        sortBy: 'name',
        order: 'ASC',
      }),
    );

    return brands
      .filter((brand) => !brand.deletedAt)
      .map((brand) => this.normalizeFilterOption(brand))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }

  private async loadAllAdminCategories(): Promise<FilterOption[]> {
    const categories = await this.collectAllPages<AdminCategoryListItem>((offset, limit) =>
      this.categoriesService.findAll({
        offset,
        limit,
        sortBy: 'name',
        order: 'ASC',
      }),
    );

    return categories
      .filter((category) => !category.deletedAt)
      .map((category) => this.normalizeFilterOption(category))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }

  private async collectAllPages<T>(
    request: (offset: number, limit: number) => Observable<{ data: T[]; meta: ApiListMeta }>,
  ): Promise<T[]> {
    const firstPage = await firstValueFrom(request(0, FILTERS_PAGE_SIZE));
    const items = [...firstPage.data];
    const total = firstPage.meta.total;

    for (let offset = FILTERS_PAGE_SIZE; offset < total; offset += FILTERS_PAGE_SIZE) {
      const response = await firstValueFrom(request(offset, FILTERS_PAGE_SIZE));
      items.push(...response.data);
    }

    return items;
  }
}

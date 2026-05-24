import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import {
  DateRangeField,
  type DateRangeValue,
} from '../../../../../shared/material/date-range-field/date-range-field';
import { ToastService } from '../../../../../shared/services/toast.service';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { AdminBannersService } from '../../../services/admin-banners.service';
import { CategoriesService } from '../../../../03-commerce/ecommerce/services/categories.service';
import {
  ProductsService,
  SortByProductsPublic,
} from '../../../../03-commerce/ecommerce/services/products.service';
import {
  BrandsService,
  SortByBrandsPublic,
} from '../../../../03-commerce/ecommerce/services/brands.service';
import type { Datum as CategoryNode } from '../../../../03-commerce/ecommerce/pages/categories-page/interfaces/categories-response.interface';
import type { Datum as BrandItem } from '../../../../03-commerce/ecommerce/pages/brands-page/interfaces/brands-response.interface';
import type { Datum as ProductItem } from '../../../../03-commerce/ecommerce/pages/products-page/interfaces/products-response.interface';
import type { AdminBannerDetail } from '../../../interfaces/admin-banner.interface';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BRANDS_LIMIT = 100;
const PRODUCTS_LIMIT = 24;
const SELECTED_PRODUCTS_LIMIT = 100;

interface FlatCategoryItem {
  id: string;
  name: string;
  slug: string;
  level: number;
}

@Component({
  selector: 'banner-edit-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Breadcrumb, DateRangeField],
  templateUrl: './banner-edit.html',
  styleUrl: '../banner-create/banner-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerEditPage {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly bannersService = inject(AdminBannersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly brandsService = inject(BrandsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly bannerId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.maxLength(500)]],
    ctaLabel: ['', [Validators.maxLength(80)]],
    isActive: [true],
  });

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly banner = signal<AdminBannerDetail | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly currentImageUrl = signal<string | null>(null);
  readonly currentImageName = signal('');
  readonly isDragOver = signal(false);

  readonly startsAt = signal('');
  readonly endsAt = signal('');

  readonly categorySearch = signal('');
  readonly brandSearch = signal('');
  readonly productSearch = signal('');

  readonly selectedCategoryIds = signal<string[]>([]);
  readonly selectedBrandIds = signal<string[]>([]);
  readonly selectedProductIds = signal<string[]>([]);
  readonly selectedProductItems = signal<ProductItem[]>([]);

  readonly categoriesResponse = toSignal(
    this.categoriesService.getTree().pipe(map((response) => this.flattenCategories(response.data))),
    { initialValue: [] as FlatCategoryItem[] },
  );

  readonly brandsResponse = toSignal(
    this.brandsService
      .getBrands({
        limit: BRANDS_LIMIT,
        offset: 0,
        order: 'ASC',
        sortBy: SortByBrandsPublic.name,
      })
      .pipe(map((response) => response.data)),
    { initialValue: [] as BrandItem[] },
  );

  readonly productOptions = toSignal(
    toObservable(this.productSearch).pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((search) =>
        this.productsService.getProducts({
          limit: PRODUCTS_LIMIT,
          offset: 0,
          order: 'ASC',
          sortBy: SortByProductsPublic.title,
          search: search || undefined,
        }),
      ),
      map((response) => response.data),
    ),
    { initialValue: [] as ProductItem[] },
  );

  readonly filteredCategories = computed(() => {
    const search = this.categorySearch().trim().toLowerCase();
    const categories = this.categoriesResponse();
    if (!search) return categories;
    return categories.filter((item) => item.name.toLowerCase().includes(search));
  });

  readonly filteredBrands = computed(() => {
    const search = this.brandSearch().trim().toLowerCase();
    const brands = this.brandsResponse();
    if (!search) return brands;
    return brands.filter((item) => item.name.toLowerCase().includes(search));
  });

  readonly selectedCategoriesPreview = computed(() =>
    this.categoriesResponse().filter((item) => this.selectedCategoryIds().includes(item.id)),
  );

  readonly selectedBrandsPreview = computed(() =>
    this.brandsResponse().filter((item) => this.selectedBrandIds().includes(item.id)),
  );

  readonly selectedProductsPreview = computed(() => {
    const selectedIds = new Set(this.selectedProductIds());
    return this.selectedProductItems().filter((item) => selectedIds.has(item.id));
  });

  readonly hasDateRangeError = computed(() => this.hasInvalidDateRange());

  readonly validitySummary = computed(() => ({
    start: this.startsAt() || 'Desde ahora',
    end: this.endsAt() || 'Sin vencimiento',
  }));

  readonly selectedImageName = computed(() => {
    const currentImageName = this.currentImageName();
    return this.selectedImage()?.name ?? (currentImageName || 'Sin imagen cargada');
  });

  readonly displayImageUrl = computed(() => this.previewUrl() || this.currentImageUrl());

  readonly summary = computed(() => ({
    title: this.form.controls.title.value.trim() || 'Sin titulo',
    ctaLabel: this.form.controls.ctaLabel.value.trim() || 'Sin CTA',
    isActive: this.form.controls.isActive.value,
    hasImage: !!this.displayImageUrl(),
    categories: this.selectedCategoryIds().length,
    brands: this.selectedBrandIds().length,
    products: this.selectedProductIds().length,
    startsAt: this.validitySummary().start,
    endsAt: this.validitySummary().end,
  }));

  constructor() {
    this.loadBanner();

    toObservable(this.productOptions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((visibleProducts) => {
        if (visibleProducts.length === 0) return;

        const visibleById = new Map(visibleProducts.map((item) => [item.id, item]));
        this.selectedProductItems.update((items) =>
          items.map((item) => visibleById.get(item.id) ?? item),
        );
      });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/banners'], {
      queryParamsHandling: 'preserve',
    });
  }

  openFileDialog(): void {
    this.fileInput?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.handleFile(file);
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.handleFile(file);
  }

  onDateRangeChange(range: DateRangeValue): void {
    this.startsAt.set(range.start);
    this.endsAt.set(range.end);
  }

  toggleCategory(id: string, checked: boolean): void {
    this.updateSelection(this.selectedCategoryIds, id, checked);
  }

  toggleBrand(id: string, checked: boolean): void {
    this.updateSelection(this.selectedBrandIds, id, checked);
  }

  toggleProduct(id: string, checked: boolean): void {
    if (checked) {
      const product = this.productOptions().find((item) => item.id === id);
      if (product) {
        this.selectedProductItems.update((items) =>
          items.some((item) => item.id === id) ? items : [...items, product],
        );
      }
    } else {
      this.selectedProductItems.update((items) => items.filter((item) => item.id !== id));
    }

    this.updateSelection(this.selectedProductIds, id, checked);
  }

  removeCategory(id: string): void {
    this.selectedCategoryIds.update((items) => items.filter((item) => item !== id));
  }

  removeBrand(id: string): void {
    this.selectedBrandIds.update((items) => items.filter((item) => item !== id));
  }

  removeProduct(id: string): void {
    this.selectedProductIds.update((items) => items.filter((item) => item !== id));
    this.selectedProductItems.update((items) => items.filter((item) => item.id !== id));
  }

  isCategorySelected(id: string): boolean {
    return this.selectedCategoryIds().includes(id);
  }

  isBrandSelected(id: string): boolean {
    return this.selectedBrandIds().includes(id);
  }

  isProductSelected(id: string): boolean {
    return this.selectedProductIds().includes(id);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitError.set(null);

    if (!this.displayImageUrl()) {
      this.imageError.set('La imagen es obligatoria.');
      return;
    }

    if (this.hasInvalidDateRange()) {
      this.submitError.set('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    this.saving.set(true);

    this.bannersService
      .update(
        this.bannerId,
        {
          title: this.form.controls.title.value.trim(),
          description: this.emptyToUndefined(this.form.controls.description.value),
          ctaLabel: this.emptyToUndefined(this.form.controls.ctaLabel.value),
          isActive: this.form.controls.isActive.value,
          startsAt: this.toPayloadDate(this.startsAt(), 'start'),
          endsAt: this.toPayloadDate(this.endsAt(), 'end'),
          categoriesIds: this.selectedCategoryIds(),
          brandsIds: this.selectedBrandIds(),
          productsIds: this.selectedProductIds(),
        },
        this.selectedImage() ?? undefined,
      )
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (banner) => {
          this.banner.set(banner);
          this.currentImageUrl.set(banner.imageUrl);
          this.currentImageName.set(this.extractImageName(banner.imageKey));
          this.setImage(null);
          this.toastService.success('Banner actualizado', `El banner "${banner.title}" fue actualizado correctamente.`);
          this.router.navigate(['/admin/banners'], {
            queryParams: { updated: banner.id },
          });
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo actualizar el banner');
        },
      });
  }

  deleteBanner(): void {
    const currentBanner = this.banner();
    if (!currentBanner || this.deleting()) return;

    this.dialogService
      .confirm({
        title: 'Eliminar Banner',
        message: `¿Estás seguro de eliminar el banner "${currentBanner.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.deleting.set(true);
        this.bannersService
          .delete(currentBanner.id)
          .pipe(
            finalize(() => this.deleting.set(false)),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe({
            next: (result) => {
              this.toastService.success('Banner eliminado', result.message);
              this.router.navigate(['/admin/banners'], {
                queryParams: { deleted: currentBanner.id },
              });
            },
            error: (err: { error?: { message?: string }; message?: string }) => {
              this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo eliminar el banner');
            },
          });
      });
  }

  private loadBanner(): void {
    if (!this.bannerId) {
      this.loadError.set('No se pudo identificar el banner a editar.');
      this.loading.set(false);
      return;
    }

    this.bannersService
      .findOne(this.bannerId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (banner) => {
          this.banner.set(banner);
          this.currentImageUrl.set(banner.imageUrl);
          this.currentImageName.set(this.extractImageName(banner.imageKey));
          this.form.patchValue({
            title: banner.title,
            description: banner.description ?? '',
            ctaLabel: banner.ctaLabel ?? '',
            isActive: banner.isActive,
          });
          this.startsAt.set(this.fromApiDate(banner.startsAt));
          this.endsAt.set(this.fromApiDate(banner.endsAt));
          this.selectedCategoryIds.set(banner.categoriesIds ?? []);
          this.selectedBrandIds.set(banner.brandsIds ?? []);
          this.selectedProductIds.set(banner.productsIds ?? []);
          this.loadSelectedProducts(banner.productsIds ?? []);
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.loadError.set(err?.error?.message ?? err?.message ?? 'No se pudo cargar el banner');
        },
      });
  }

  private loadSelectedProducts(productIds: string[]): void {
    if (productIds.length === 0) {
      this.selectedProductItems.set([]);
      return;
    }

    this.productsService
      .getProducts({
        limit: Math.max(productIds.length, SELECTED_PRODUCTS_LIMIT),
        offset: 0,
        order: 'ASC',
        sortBy: SortByProductsPublic.title,
        productIds,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.selectedProductItems.set(response.data.filter((item) => productIds.includes(item.id)));
        },
        error: () => {
          this.selectedProductItems.set([]);
        },
      });
  }

  private handleFile(file: File | null): void {
    this.imageError.set(null);

    if (!file) {
      this.setImage(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      this.imageError.set('Solo se permiten imágenes JPG, PNG o WEBP.');
      this.resetFileInput();
      this.setImage(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.imageError.set('La imagen no puede superar 1 MB.');
      this.resetFileInput();
      this.setImage(null);
      return;
    }

    this.setImage(file);
  }

  private resetFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private updateSelection(
    target: { update: (fn: (items: string[]) => string[]) => void },
    id: string,
    checked: boolean,
  ): void {
    target.update((items) => {
      if (checked) {
        return items.includes(id) ? items : [...items, id];
      }

      return items.filter((item) => item !== id);
    });
  }

  private emptyToUndefined(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private hasInvalidDateRange(): boolean {
    const start = this.startsAt();
    const end = this.endsAt();

    if (!start || !end) return false;

    return start > end;
  }

  private toPayloadDate(value: string, boundary: 'start' | 'end'): string | undefined {
    if (!value) return undefined;

    const suffix = boundary === 'start' ? 'T00:00:00' : 'T23:59:59';
    const date = new Date(`${value}${suffix}`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private fromApiDate(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private setImage(file: File | null): void {
    const previousPreview = this.previewUrl();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    this.selectedImage.set(file);
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  private extractImageName(imageKey: string): string {
    const segments = imageKey.split('/');
    return segments[segments.length - 1] || imageKey;
  }

  private flattenCategories(nodes: CategoryNode[], level = 0): FlatCategoryItem[] {
    return nodes.flatMap((node) => [
      {
        id: node.id,
        name: node.name,
        slug: node.slug,
        level,
      },
      ...this.flattenCategories(node.children ?? [], level + 1),
    ]);
  }
}

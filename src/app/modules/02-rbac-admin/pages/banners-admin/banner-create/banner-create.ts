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
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import {
  DateRangeField,
  type DateRangeValue,
} from '../../../../../shared/material/date-range-field/date-range-field';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminBannersService } from '../../../services/admin-banners.service';
import { CategoriesService } from '../../../../03-commerce/ecommerce/services/categories.service';
import { ProductsService, SortByProductsPublic } from '../../../../03-commerce/ecommerce/services/products.service';
import { BrandsService, SortByBrandsPublic } from '../../../../03-commerce/ecommerce/services/brands.service';
import type { Datum as CategoryNode } from '../../../../03-commerce/ecommerce/pages/categories-page/interfaces/categories-response.interface';
import type { Datum as BrandItem } from '../../../../03-commerce/ecommerce/pages/brands-page/interfaces/brands-response.interface';
import type { Datum as ProductItem } from '../../../../03-commerce/ecommerce/pages/products-page/interfaces/products-response.interface';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BRANDS_LIMIT = 100;
const PRODUCTS_LIMIT = 24;

interface FlatCategoryItem {
  id: string;
  name: string;
  slug: string;
  level: number;
}

@Component({
  selector: 'banner-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Breadcrumb, DateRangeField],
  templateUrl: './banner-create.html',
  styleUrl: './banner-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCreatePage {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly bannersService = inject(AdminBannersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly brandsService = inject(BrandsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.maxLength(500)]],
    ctaLabel: ['', [Validators.maxLength(80)]],
    isActive: [true],
  });

  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
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
    this.categoriesService.getTree().pipe(
      map((response) => this.flattenCategories(response.data)),
    ),
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

  readonly selectedImageName = computed(() => this.selectedImage()?.name ?? 'Sin imagen cargada');

  readonly summary = computed(() => ({
    title: this.form.controls.title.value.trim() || 'Sin titulo',
    ctaLabel: this.form.controls.ctaLabel.value.trim() || 'Sin CTA',
    isActive: this.form.controls.isActive.value,
    hasImage: !!this.selectedImage(),
    categories: this.selectedCategoryIds().length,
    brands: this.selectedBrandIds().length,
    products: this.selectedProductIds().length,
    startsAt: this.validitySummary().start,
    endsAt: this.validitySummary().end,
  }));

  constructor() {
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

    if (!this.selectedImage()) {
      this.imageError.set('La imagen es obligatoria.');
      return;
    }

    if (this.hasInvalidDateRange()) {
      this.submitError.set('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    this.saving.set(true);

    this.bannersService
      .create(
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
        this.selectedImage()!,
      )
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (banner) => {
          this.toastService.success(
            'Banner creado',
            `El banner "${banner.title}" fue creado y quedó primero en el orden.`,
          );
          this.router.navigate(['/admin/banners'], {
            queryParams: { created: banner.id },
          });
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.submitError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo crear el banner',
          );
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

  private updateSelection(target: { update: (fn: (items: string[]) => string[]) => void }, id: string, checked: boolean): void {
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

  private setImage(file: File | null): void {
    const previousPreview = this.previewUrl();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    this.selectedImage.set(file);
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
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

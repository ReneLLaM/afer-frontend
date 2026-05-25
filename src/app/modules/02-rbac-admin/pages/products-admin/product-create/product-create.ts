import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, finalize, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminProductsService } from '../../../services/admin-products.service';
import { AdminBrandsService } from '../../../services/admin-brands.service';
import { AdminCategoriesService } from '../../../services/admin-categories.service';
import type {
  AdminBrandListItem,
} from '../../../interfaces/admin-brand.interface';
import type {
  AdminCategoryListItem,
} from '../../../interfaces/admin-category.interface';
import type {
  AdminProductDetail,
  AdminProductImageMutationItem,
  AdminProductSpecificationMutationItem,
  AdminProductVideoMutationItem,
  CreateAdminProductDto,
  UpdateAdminProductDto,
  ProductStatus,
} from '../../../interfaces/admin-product.interface';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FILTERS_PAGE_SIZE = 200;
const PRODUCT_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

const PRICE_FORMATTER = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface BrandOption {
  id: string;
  name: string;
  slug: string;
  label: string;
  searchText: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  label: string;
  searchText: string;
}

interface ProductImageDraft {
  id?: string;
  file?: File;
  previewUrl: string;
  name: string;
  source: 'existing' | 'new';
}

type VideoFormGroup = FormGroup<{
  id: FormControl<string>;
  html: FormControl<string>;
}>;

type SpecificationFormGroup = FormGroup<{
  id: FormControl<string>;
  group: FormControl<string>;
  descriptionSpecifications: FormControl<string>;
}>;

function arrayMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const length = Array.isArray(value) ? value.length : 0;
    return length >= min
      ? null
      : { minArrayLength: { requiredLength: min, actualLength: length } };
  };
}

function stockValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const minStock = control.get('minStock')?.value as number | null | undefined;
    const maxStock = control.get('maxStock')?.value as number | null | undefined;
    const currentStock = control.get('currentStock')?.value as number | null | undefined;

    if (minStock != null && maxStock != null && maxStock < minStock) {
      return { stockRange: 'El stock máximo no puede ser menor al stock mínimo.' };
    }

    if (currentStock != null && maxStock != null && currentStock > maxStock) {
      return { stockCurrent: 'El stock actual no puede superar el stock máximo.' };
    }

    return null;
  };
}

function tiktokEmbedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null;
    }

    const normalized = value.toLowerCase();
    const isTikTokEmbed =
      normalized.includes('tiktok.com') &&
      (normalized.includes('<blockquote') || normalized.includes('<iframe'));

    return isTikTokEmbed ? null : { tiktokEmbed: true };
  };
}

@Component({
  selector: 'product-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Breadcrumb],
  templateUrl: './product-create.html',
  styleUrl: './product-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCreatePage {
  @ViewChild('imagesInput') private readonly imagesInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly productsService = inject(AdminProductsService);
  private readonly brandsService = inject(AdminBrandsService);
  private readonly categoriesService = inject(AdminCategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly term = this.route.snapshot.paramMap.get('term') ?? '';

  readonly statusOptions: { value: ProductStatus; label: string }[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'deprecated', label: 'Deprecado' },
  ];

  readonly isEditMode = computed(() => !!this.term);
  readonly pageEyebrow = computed(() => (this.isEditMode() ? 'Edicion de producto' : 'Nuevo producto'));
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Producto' : 'Crear Producto'));
  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Actualiza identidad comercial, galería, videos TikTok, especificaciones y stock desde una sola vista.'
      : 'Arma la ficha comercial completa con identidad, stock, galería inicial, videos TikTok y contenido listo para tienda y admin.',
  );
  readonly heroBadge = computed(() => (this.isEditMode() ? 'Edición completa + reordenamiento' : 'Alta guiada + catálogo listo'));
  readonly submitLabel = computed(() => {
    if (this.saving()) {
      return this.isEditMode() ? 'Guardando...' : 'Creando...';
    }

    return this.isEditMode() ? 'Guardar cambios' : 'Crear producto';
  });

  readonly form = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(180)]),
      sku: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
      slug: this.fb.nonNullable.control('', [Validators.maxLength(180)]),
      price: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
      brandId: this.fb.nonNullable.control('', [Validators.required]),
      categoryIds: this.fb.nonNullable.control<string[]>([], [arrayMinLength(1)]),
      description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(4000)]),
      features: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(4000)]),
      specificationsSummary: this.fb.nonNullable.control('', [Validators.maxLength(800)]),
      status: this.fb.nonNullable.control<ProductStatus>('active'),
      isFeatured: this.fb.nonNullable.control(false),
      isTrending: this.fb.nonNullable.control(false),
      isNew: this.fb.nonNullable.control(false),
      minStock: this.fb.control<number | null>(0, [Validators.min(0)]),
      maxStock: this.fb.control<number | null>(null, [Validators.min(0)]),
      currentStock: this.fb.control<number | null>(0, [Validators.min(0)]),
      warrantyMonths: this.fb.control<number | null>(12, [Validators.min(0)]),
      warrantyDescription: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
      videos: this.fb.array<VideoFormGroup>([]),
      specifications: this.fb.array<SpecificationFormGroup>([]),
    },
    { validators: stockValidator() },
  );

  readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly loadingOptions = signal(true);
  readonly loadingProduct = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly optionsError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly brandOptions = signal<BrandOption[]>([]);
  readonly categoryOptions = signal<CategoryOption[]>([]);
  readonly brandSearch = linkedSignal(() => this.selectedBrand()?.label ?? '');
  readonly categorySearch = signal('');
  readonly selectedImages = signal<ProductImageDraft[]>([]);
  readonly isDragOver = signal(false);
  readonly product = signal<AdminProductDetail | null>(null);

  // Drag state for images (gallery reorder)
  readonly isDraggingImage = signal<number | null>(null);
  readonly isDragOverImage = signal<number | null>(null);

  // Drag state for videos
  readonly isDraggingVideo = signal<number | null>(null);
  readonly isDragOverVideo = signal<number | null>(null);

  // Drag state for specifications
  readonly isDraggingSpec = signal<number | null>(null);
  readonly isDragOverSpec = signal<number | null>(null);

  readonly selectedBrand = computed(() => {
    const brandId = this.formValue().brandId ?? '';
    return this.brandOptions().find((option) => option.id === brandId) ?? null;
  });
  readonly selectedCategories = computed(() => {
    const selectedIds = new Set(this.formValue().categoryIds ?? []);
    return this.categoryOptions().filter((option) => selectedIds.has(option.id));
  });
  readonly filteredBrandOptions = computed(() => {
    const term = this.normalizeText(this.brandSearch());
    const options = this.brandOptions();

    if (!term) {
      return options;
    }

    return options.filter((option) => option.searchText.includes(term));
  });
  readonly filteredCategoryOptions = computed(() => {
    const term = this.normalizeText(this.categorySearch());
    const selectedIds = new Set(this.formValue().categoryIds ?? []);
    const available = this.categoryOptions().filter((option) => !selectedIds.has(option.id));

    if (!term) {
      return available;
    }

    return available.filter((option) => option.searchText.includes(term));
  });
  readonly summary = computed(() => {
    const formValue = this.formValue();
    const title = formValue.title?.trim() ?? '';
    const sku = formValue.sku?.trim() ?? '';
    const price = formValue.price?.trim() ?? '';

    return {
      title: title || 'Producto sin titulo',
      sku: sku || 'SKU pendiente',
      brand: this.selectedBrand()?.name ?? 'Marca por definir',
      status:
        this.statusOptions.find((option) => option.value === formValue.status)?.label ?? 'Activo',
      categoriesCount: this.selectedCategories().length,
      imagesCount: this.selectedImages().length,
      videosCount: this.videosArray.length,
      specificationsCount: this.specificationsArray.length,
      priceLabel:
        price && /^\d+(\.\d{1,2})?$/.test(price)
          ? `Bs ${PRICE_FORMATTER.format(Number(price))}`
          : 'Bs 0.00',
      description:
        formValue.specificationsSummary?.trim() ||
        formValue.description?.trim() ||
        'Completa la información para ver el resumen comercial del producto.',
      coverImage: this.selectedImages()[0]?.previewUrl || PRODUCT_IMAGE_PLACEHOLDER,
    };
  });
  readonly inventoryError = computed(() => {
    const errors = this.form.errors;
    return errors?.['stockRange'] ?? errors?.['stockCurrent'] ?? null;
  });
  readonly isBootstrapping = computed(() => this.loadingOptions() || this.loadingProduct());

  constructor() {
    void this.loadInitialData();
    this.destroyRef.onDestroy(() => this.releaseAllPreviews());
  }

  get videosArray(): FormArray<VideoFormGroup> {
    return this.form.controls.videos;
  }

  get specificationsArray(): FormArray<SpecificationFormGroup> {
    return this.form.controls.specifications;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/productos'], { queryParamsHandling: 'preserve' });
  }

  openImagesDialog(): void {
    this.imagesInput?.nativeElement.click();
  }

  onImagesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleImageFiles(Array.from(input.files ?? []));
    input.value = '';
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
    this.handleImageFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onPriceBlur(): void {
    const normalized = this.form.controls.price.value.replace(',', '.').trim();
    this.form.controls.price.setValue(normalized);
  }

  onBrandSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.brandSearch.set(value);

    const exactMatch = this.matchBrand(value);
    if (exactMatch) {
      this.selectBrand(exactMatch);
      return;
    }

    if (value !== this.selectedBrand()?.label) {
      this.form.controls.brandId.setValue('');
    }
  }

  selectBrand(option: BrandOption): void {
    this.form.controls.brandId.setValue(option.id);
    this.form.controls.brandId.markAsDirty();
    this.form.controls.brandId.markAsTouched();
    this.brandSearch.set(option.label);
  }

  clearBrand(): void {
    this.form.controls.brandId.setValue('');
    this.form.controls.brandId.markAsDirty();
    this.form.controls.brandId.markAsTouched();
    this.brandSearch.set('');
  }

  onCategorySearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.categorySearch.set(value);

    const exactMatch = this.matchCategory(value);
    if (exactMatch) {
      this.addCategory(exactMatch);
    }
  }

  addCategory(option: CategoryOption): void {
    const current = this.form.controls.categoryIds.value;
    if (current.includes(option.id)) {
      this.categorySearch.set('');
      return;
    }

    this.form.controls.categoryIds.setValue([...current, option.id]);
    this.form.controls.categoryIds.markAsDirty();
    this.form.controls.categoryIds.markAsTouched();
    this.categorySearch.set('');
  }

  removeCategory(categoryId: string): void {
    this.form.controls.categoryIds.setValue(
      this.form.controls.categoryIds.value.filter((id) => id !== categoryId),
    );
    this.form.controls.categoryIds.markAsDirty();
    this.form.controls.categoryIds.markAsTouched();
  }

  addVideo(): void {
    this.videosArray.push(this.createVideoGroup());
  }

  removeVideo(index: number): void {
    this.videosArray.removeAt(index);
  }

  moveVideo(index: number, direction: -1 | 1): void {
    this.moveArrayItem(this.videosArray, index, index + direction);
  }

  addSpecification(): void {
    this.specificationsArray.push(this.createSpecificationGroup());
  }

  removeSpecification(index: number): void {
    this.specificationsArray.removeAt(index);
  }

  moveSpecification(index: number, direction: -1 | 1): void {
    this.moveArrayItem(this.specificationsArray, index, index + direction);
  }

  moveImage(index: number, direction: -1 | 1): void {
    const images = [...this.selectedImages()];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const [image] = images.splice(index, 1);
    if (!image) return;
    images.splice(targetIndex, 0, image);
    this.selectedImages.set(images);
  }

  // ── Image drag & drop (gallery reorder) ──────────────────────────────
  onImageDragStart(event: DragEvent, index: number): void {
    this.isDraggingImage.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onImageDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.isDragOverImage.set(index);
  }

  onImageDragLeave(): void {
    this.isDragOverImage.set(null);
  }

  onImageDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const fromIndex = this.isDraggingImage();
    if (fromIndex === null || fromIndex === targetIndex) {
      this.isDraggingImage.set(null);
      this.isDragOverImage.set(null);
      return;
    }

    const images = [...this.selectedImages()];
    const [moved] = images.splice(fromIndex, 1);
    if (!moved) return;
    images.splice(targetIndex, 0, moved);
    this.selectedImages.set(images);
    this.isDraggingImage.set(null);
    this.isDragOverImage.set(null);
  }

  onImageDragEnd(): void {
    this.isDraggingImage.set(null);
    this.isDragOverImage.set(null);
  }

  // ── Video drag & drop ─────────────────────────────────────────────────
  onVideoDragStart(event: DragEvent, index: number): void {
    this.isDraggingVideo.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onVideoDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.isDragOverVideo.set(index);
  }

  onVideoDragLeave(): void {
    this.isDragOverVideo.set(null);
  }

  onVideoDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const fromIndex = this.isDraggingVideo();
    if (fromIndex === null || fromIndex === targetIndex) {
      this.isDraggingVideo.set(null);
      this.isDragOverVideo.set(null);
      return;
    }

    this.moveArrayItem(this.videosArray, fromIndex, targetIndex);
    this.isDraggingVideo.set(null);
    this.isDragOverVideo.set(null);
  }

  onVideoDragEnd(): void {
    this.isDraggingVideo.set(null);
    this.isDragOverVideo.set(null);
  }

  // ── Specification drag & drop ─────────────────────────────────────────
  onSpecDragStart(event: DragEvent, index: number): void {
    this.isDraggingSpec.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onSpecDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.isDragOverSpec.set(index);
  }

  onSpecDragLeave(): void {
    this.isDragOverSpec.set(null);
  }

  onSpecDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const fromIndex = this.isDraggingSpec();
    if (fromIndex === null || fromIndex === targetIndex) {
      this.isDraggingSpec.set(null);
      this.isDragOverSpec.set(null);
      return;
    }

    this.moveArrayItem(this.specificationsArray, fromIndex, targetIndex);
    this.isDraggingSpec.set(null);
    this.isDragOverSpec.set(null);
  }

  onSpecDragEnd(): void {
    this.isDraggingSpec.set(null);
    this.isDragOverSpec.set(null);
  }

  removeImage(index: number): void {
    const images = [...this.selectedImages()];
    const [removed] = images.splice(index, 1);
    if (removed?.source === 'new') {
      URL.revokeObjectURL(removed.previewUrl);
    }
    this.selectedImages.set(images);

    if (!images.length) {
      this.imageError.set('Necesitas al menos una imagen para guardar el producto.');
    }
  }

  formatBytes(size: number): string {
    if (size < 1024) return `${size} B`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.imageError.set(null);
    this.submitError.set(null);

    const hasImages = this.selectedImages().length > 0;
    if (!hasImages) {
      this.imageError.set('Necesitas al menos una imagen para guardar el producto.');
    }

    if (this.form.invalid || !hasImages) {
      const invalidControls: string[] = [];
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control?.invalid) {
          invalidControls.push(key);
        }
      });

      if (this.form.errors) {
        if (this.form.errors['stockRange']) {
          invalidControls.push('Rango de Stock: ' + this.form.errors['stockRange']);
        }
        if (this.form.errors['stockCurrent']) {
          invalidControls.push('Stock Actual: ' + this.form.errors['stockCurrent']);
        }
      }

      console.warn('El formulario no es válido. Campos con errores:', invalidControls);
      this.submitError.set(
        `El formulario contiene errores o campos incompletos: ${invalidControls.join(', ')}`
      );
      return;
    }

    this.submitError.set(null);
    this.saving.set(true);

    const payload = this.buildPayload();
    const imageFiles = this.selectedImages()
      .filter((image) => image.source === 'new' && image.file)
      .map((image) => image.file as File);

    const request$ = this.isEditMode()
      ? this.productsService.update(this.term, payload as UpdateAdminProductDto, imageFiles)
      : this.productsService.create(payload as CreateAdminProductDto, imageFiles);

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => {
          this.toastService.success(
            this.isEditMode() ? 'Producto actualizado' : 'Producto creado',
            this.isEditMode()
              ? `El producto "${product.title}" fue actualizado correctamente.`
              : `El producto "${product.title}" fue creado correctamente.`,
          );
          this.router.navigate(['/admin/productos', product.id], {
            queryParamsHandling: 'preserve',
          });
        },
        error: (err: { error?: { message?: string | string[] }; message?: string | string[] }) => {
          const errMsg = err?.error?.message ?? err?.message;
          const displayMsg = Array.isArray(errMsg)
            ? errMsg.join(', ')
            : errMsg ?? (this.isEditMode() ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto');

          console.error('Error al guardar el producto:', err);
          this.submitError.set(displayMsg);
        },
      });
  }

  private async loadInitialData(): Promise<void> {
    this.loadingOptions.set(true);
    this.loadingProduct.set(this.isEditMode());
    this.optionsError.set(null);
    this.loadError.set(null);

    try {
      const brandPromise = this.loadAllBrands();
      const categoryPromise = this.loadAllCategories();
      const productPromise = this.isEditMode()
        ? firstValueFrom(this.productsService.findOne(this.term))
        : Promise.resolve(null);

      const [brands, categories, product] = await Promise.all([
        brandPromise,
        categoryPromise,
        productPromise,
      ]);

      this.brandOptions.set(brands.map((item) => this.toBrandOption(item)));
      this.categoryOptions.set(categories.map((item) => this.toCategoryOption(item)));

      if (product) {
        this.product.set(product);
        this.enrichOptionsFromProduct(product);
        this.patchProduct(product);
      }
    } catch (err) {
      const error = err as { error?: { message?: string }; message?: string };
      const message =
        error?.error?.message ?? error?.message ?? 'No se pudo cargar la información del formulario.';

      if (this.isEditMode() && !this.product()) {
        this.loadError.set(message);
      } else {
        this.optionsError.set(message);
      }
    } finally {
      this.loadingOptions.set(false);
      this.loadingProduct.set(false);
    }
  }

  private patchProduct(product: AdminProductDetail): void {
    this.form.patchValue({
      title: product.title,
      sku: product.sku,
      slug: product.slug,
      price: product.price,
      brandId: product.brand?.id ?? '',
      categoryIds: product.categories.map((category) => category.id),
      description: product.description,
      features: product.features,
      specificationsSummary: product.specificationsSummary ?? '',
      status: product.status,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
      isNew: product.isNew,
      minStock: product.minStock,
      maxStock: product.maxStock,
      currentStock: product.currentStock,
      warrantyMonths: product.warrantyMonths,
      warrantyDescription: product.warrantyDescription ?? '',
    });

    this.videosArray.clear();
    for (const video of product.videos) {
      this.videosArray.push(this.createVideoGroup(video.id, video.url));
    }

    this.specificationsArray.clear();
    for (const specification of product.specifications) {
      this.specificationsArray.push(
        this.createSpecificationGroup(
          specification.id,
          specification.group,
          specification.descriptionSpecifications,
        ),
      );
    }

    this.releaseAllPreviews();
    this.selectedImages.set(
      product.images.map((image, index) => ({
        id: image.id,
        previewUrl: image.url || PRODUCT_IMAGE_PLACEHOLDER,
        name: `Imagen ${index + 1}`,
        source: 'existing' as const,
      })),
    );

    if (product.brand) {
      const brandLabel = this.brandOptions().find((option) => option.id === product.brand!.id)?.label;
      if (brandLabel) {
        this.brandSearch.set(brandLabel);
      }
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.imageError.set(null);
  }

  private enrichOptionsFromProduct(product: AdminProductDetail): void {
    if (product.brand && !this.brandOptions().some((option) => option.id === product.brand!.id)) {
      this.brandOptions.update((options) => [
        ...options,
        this.brandOptionFromRef(product.brand!),
      ]);
    }

    const missingCategories = product.categories.filter(
      (category) => !this.categoryOptions().some((option) => option.id === category.id),
    );

    if (missingCategories.length) {
      this.categoryOptions.update((options) => [
        ...options,
        ...missingCategories.map((category) => this.categoryOptionFromRef(category)),
      ]);
    }
  }

  private async loadAllBrands(): Promise<AdminBrandListItem[]> {
    const items: AdminBrandListItem[] = [];
    let offset = 0;

    while (true) {
      const response = await firstValueFrom(
        this.brandsService.findAll({
          limit: FILTERS_PAGE_SIZE,
          offset,
          sortBy: 'name',
          order: 'ASC',
        }),
      );

      items.push(...response.data);
      offset += response.meta.limit;

      if (offset >= response.meta.total || response.data.length === 0) {
        break;
      }
    }

    return items;
  }

  private async loadAllCategories(): Promise<AdminCategoryListItem[]> {
    const items: AdminCategoryListItem[] = [];
    let offset = 0;

    while (true) {
      const response = await firstValueFrom(
        this.categoriesService.findAll({
          limit: FILTERS_PAGE_SIZE,
          offset,
          sortBy: 'name',
          order: 'ASC',
        }),
      );

      items.push(...response.data);
      offset += response.meta.limit;

      if (offset >= response.meta.total || response.data.length === 0) {
        break;
      }
    }

    return items;
  }

  private toBrandOption(item: AdminBrandListItem): BrandOption {
    return this.brandOptionFromRef(item);
  }

  private toCategoryOption(item: AdminCategoryListItem): CategoryOption {
    return this.categoryOptionFromRef(item);
  }

  private brandOptionFromRef(ref: { id: string; name: string; slug: string }): BrandOption {
    return {
      id: ref.id,
      name: ref.name,
      slug: ref.slug,
      label: `${ref.name} · ${ref.slug}`,
      searchText: this.normalizeText(`${ref.name} ${ref.slug}`),
    };
  }

  private categoryOptionFromRef(ref: { id: string; name: string; slug: string }): CategoryOption {
    return {
      id: ref.id,
      name: ref.name,
      slug: ref.slug,
      label: `${ref.name} · ${ref.slug}`,
      searchText: this.normalizeText(`${ref.name} ${ref.slug}`),
    };
  }

  private matchBrand(value: string): BrandOption | null {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;

    return (
      this.brandOptions().find((option) =>
        [option.label, option.name, option.slug].some((item) => this.normalizeText(item) === normalized),
      ) ?? null
    );
  }

  private matchCategory(value: string): CategoryOption | null {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;

    return (
      this.categoryOptions().find((option) =>
        [option.label, option.name, option.slug].some((item) => this.normalizeText(item) === normalized),
      ) ?? null
    );
  }

  private createVideoGroup(id = '', html = ''): VideoFormGroup {
    return this.fb.nonNullable.group({
      id: [id],
      html: [html, [Validators.required, tiktokEmbedValidator()]],
    });
  }

  private createSpecificationGroup(
    id = '',
    group = '',
    descriptionSpecifications = '',
  ): SpecificationFormGroup {
    return this.fb.nonNullable.group({
      id: [id],
      group: [group, [Validators.required, Validators.maxLength(120)]],
      descriptionSpecifications: [descriptionSpecifications, [Validators.required, Validators.maxLength(1200)]],
    });
  }

  private moveArrayItem(
    array: FormArray,
    fromIndex: number,
    toIndex: number,
  ): void {
    if (toIndex < 0 || toIndex >= array.length || fromIndex === toIndex) {
      return;
    }

    const control = array.at(fromIndex);
    array.removeAt(fromIndex);
    array.insert(toIndex, control);
    array.markAsDirty();
  }

  private handleImageFiles(files: readonly File[]): void {
    if (!files.length) return;

    const nextImages: ProductImageDraft[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        errors.push(`"${file.name}" no es JPG, PNG o WEBP.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`"${file.name}" supera los 2 MB.`);
        continue;
      }

      nextImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        source: 'new',
      });
    }

    if (nextImages.length) {
      this.selectedImages.set([...this.selectedImages(), ...nextImages]);
      this.imageError.set(null);
    }

    if (errors.length) {
      this.imageError.set(errors.join(' '));
    }
  }

  private buildPayload(): CreateAdminProductDto | UpdateAdminProductDto {
    const videos = this.videosArray.controls.map<AdminProductVideoMutationItem>((group, index) => ({
      id: this.emptyToUndefined(group.controls.id.value),
      url: group.controls.html.value.trim(),
      order: index + 1,
    }));

    const specifications = this.specificationsArray.controls.map<AdminProductSpecificationMutationItem>(
      (group, index) => ({
        id: this.emptyToUndefined(group.controls.id.value),
        group: group.controls.group.value.trim(),
        descriptionSpecifications: group.controls.descriptionSpecifications.value.trim(),
        order: index + 1,
      }),
    );

    const images = this.selectedImages().map<AdminProductImageMutationItem>((image, index) => ({
      id: image.id,
      url: image.source === 'existing' ? image.previewUrl : undefined,
      order: index + 1,
    }));

    return {
      title: this.form.controls.title.value.trim(),
      sku: this.form.controls.sku.value.trim(),
      slug: this.emptyToUndefined(this.form.controls.slug.value),
      price: this.form.controls.price.value.trim(),
      brandId: this.form.controls.brandId.value,
      categoryIds: this.form.controls.categoryIds.value,
      description: this.form.controls.description.value.trim(),
      features: this.form.controls.features.value.trim(),
      specificationsSummary: this.emptyToUndefined(this.form.controls.specificationsSummary.value),
      status: this.form.controls.status.value,
      isFeatured: this.form.controls.isFeatured.value,
      isTrending: this.form.controls.isTrending.value,
      isNew: this.form.controls.isNew.value,
      minStock: this.toOptionalNumber(this.form.controls.minStock.value),
      maxStock: this.toOptionalNumber(this.form.controls.maxStock.value),
      currentStock: this.toOptionalNumber(this.form.controls.currentStock.value),
      warrantyMonths: this.toOptionalNumber(this.form.controls.warrantyMonths.value),
      warrantyDescription: this.emptyToUndefined(this.form.controls.warrantyDescription.value),
      images,
      videos,
      specifications,
    };
  }

  private toOptionalNumber(value: number | null): number | undefined {
    return value === null ? undefined : value;
  }

  private emptyToUndefined(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  private releaseAllPreviews(): void {
    for (const image of this.selectedImages()) {
      if (image.source === 'new') {
        URL.revokeObjectURL(image.previewUrl);
      }
    }
  }
}

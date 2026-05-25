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
import { finalize, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminCategoriesService } from '../../../services/admin-categories.service';
import type {
  AdminCategoryTreeNode,
  CategoryStatus,
} from '../../../interfaces/admin-category.interface';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const CATEGORY_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

interface ParentOption {
  id: string;
  label: string;
  pathLabel: string;
  searchText: string;
}

@Component({
  selector: 'category-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Breadcrumb],
  templateUrl: './category-create.html',
  styleUrl: './category-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCreatePage {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly service = inject(AdminCategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions: { value: CategoryStatus; label: string }[] = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
    { value: 'deprecated', label: 'Deprecada' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.maxLength(140)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['active' as CategoryStatus],
    isFeatured: [false],
    parentId: [''],
  });

  readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly loadingParents = signal(true);
  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly parentSearch = signal('');
  readonly parentOptions = signal<ParentOption[]>([]);
  readonly selectedImage = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly previewImageUrl = computed(() => this.previewUrl() || CATEGORY_IMAGE_PLACEHOLDER);
  readonly selectedImageName = computed(() => this.selectedImage()?.name ?? 'Sin imagen cargada');
  readonly selectedParent = computed(() => {
    const parentId = this.formValue().parentId ?? '';
    if (!parentId) {
      return null;
    }

    return this.parentOptions().find((option) => option.id === parentId) ?? null;
  });
  readonly filteredParentOptions = computed(() => {
    const term = this.normalizeText(this.parentSearch());
    const options = this.parentOptions();

    if (!term) {
      return options.slice(0, 14);
    }

    return options.filter((option) => option.searchText.includes(term)).slice(0, 20);
  });
  readonly parentResultsCount = computed(() => {
    const term = this.normalizeText(this.parentSearch());
    if (!term) {
      return this.parentOptions().length;
    }

    return this.parentOptions().filter((option) => option.searchText.includes(term)).length;
  });
  readonly summary = computed(() => {
    const formValue = this.formValue();
    const name = formValue.name?.trim() ?? '';
    const description = formValue.description?.trim() ?? '';

    return {
      name: name || 'Sin nombre',
      description: description || 'Usa esta categoria para organizar el catálogo y sus relaciones.',
      status: this.statusOptions.find((item) => item.value === formValue.status)?.label || 'Activa',
      featured: formValue.isFeatured,
      parent: this.selectedParent()?.pathLabel ?? 'Categoria raiz',
    };
  });

  constructor() {
    this.loadParentOptions();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/categorias'], { queryParamsHandling: 'preserve' });
  }

  openFileDialog(): void {
    this.fileInput?.nativeElement.click();
  }

  onParentSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.parentSearch.set(input.value);
  }

  selectParent(option: ParentOption | null): void {
    this.form.controls.parentId.setValue(option?.id ?? '');
    this.form.controls.parentId.markAsDirty();
    this.form.controls.parentId.markAsTouched();
    this.parentSearch.set('');
  }

  clearParentSelection(): void {
    this.form.controls.parentId.setValue('');
    this.form.controls.parentId.markAsDirty();
    this.form.controls.parentId.markAsTouched();
    this.parentSearch.set('');
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
    this.handleFile(event.dataTransfer?.files?.[0] ?? null);
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFile(input.files?.[0] ?? null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.selectedImage()) {
      this.imageError.set('La imagen es obligatoria.');
      return;
    }

    this.submitError.set(null);
    this.saving.set(true);

    this.service
      .create(
        {
          name: this.form.controls.name.value.trim(),
          slug: this.emptyToUndefined(this.form.controls.slug.value),
          description: this.emptyToUndefined(this.form.controls.description.value),
          status: this.form.controls.status.value,
          isFeatured: this.form.controls.isFeatured.value,
          parentId: this.emptyToNull(this.form.controls.parentId.value),
        },
        this.selectedImage()!,
      )
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.toastService.success('Categoria creada', `La categoria "${result.category.name}" fue creada correctamente.`);
          this.router.navigate(['/admin/categorias', result.category.id], {
            queryParamsHandling: 'preserve',
          });
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo crear la categoria');
        },
      });
  }

  private loadParentOptions(): void {
    this.loadingParents.set(true);
    this.service
      .findTree()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.parentOptions.set(this.flattenTreeOptions(response.data));
          this.loadingParents.set(false);
        },
        error: () => {
          this.parentOptions.set([]);
          this.loadingParents.set(false);
        },
      });
  }

  private flattenTreeOptions(
    nodes: AdminCategoryTreeNode[],
    trail: string[] = [],
    acc: ParentOption[] = [],
  ): ParentOption[] {
    for (const node of nodes) {
      const path = [...trail, node.name];
      const pathLabel = path.join(' / ');

      acc.push({
        id: node.id,
        label: node.name,
        pathLabel,
        searchText: this.normalizeText(`${node.name} ${pathLabel}`),
      });

      if (node.children?.length) {
        this.flattenTreeOptions(node.children, path, acc);
      }
    }

    return acc;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
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

  private setImage(file: File | null): void {
    const previousPreview = this.previewUrl();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    this.selectedImage.set(file);
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  private emptyToUndefined(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private emptyToNull(value: string): string | null {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }
}

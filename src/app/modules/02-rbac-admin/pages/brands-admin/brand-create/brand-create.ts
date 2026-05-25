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
import { AdminBrandsService } from '../../../services/admin-brands.service';
import type { BrandStatus } from '../../../interfaces/admin-brand.interface';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_BACKGROUND = '#ffffff';
const BRAND_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

interface ColorPresetGroup {
  label: string;
  colors: string[];
}

const COLOR_PRESET_GROUPS: ColorPresetGroup[] = [
  {
    label: 'Claros',
    colors: ['#ffffff', '#f8fafc', '#eef2ff', '#eff6ff', '#ecfeff', '#ecfdf5', '#fff7ed', '#fdf2f8'],
  },
  {
    label: 'Fuertes',
    colors: ['#0f172a', '#1d4ed8', '#0369a1', '#1f8c59', '#d94c4c', '#f59e0b', '#7c3aed', '#111827'],
  },
];

@Component({
  selector: 'brand-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Breadcrumb],
  templateUrl: './brand-create.html',
  styleUrl: './brand-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandCreatePage {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly brandsService = inject(AdminBrandsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly colorPresetGroups = COLOR_PRESET_GROUPS;
  readonly statusOptions: { value: BrandStatus; label: string }[] = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
    { value: 'deprecated', label: 'Deprecada' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.maxLength(140)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['active' as BrandStatus],
    isFeatured: [false],
    backgroundColor: [DEFAULT_BACKGROUND, [Validators.required, Validators.pattern(/^#([0-9a-fA-F]{6})$/)]],
  });

  readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly selectedImageName = computed(() => this.selectedImage()?.name ?? 'Sin imagen cargada');
  readonly previewImageUrl = computed(() => this.previewUrl() || BRAND_IMAGE_PLACEHOLDER);
  readonly backgroundColor = computed(
    () => this.formValue().backgroundColor?.trim() || DEFAULT_BACKGROUND,
  );
  readonly summary = computed(() => {
    const formValue = this.formValue();
    const name = formValue.name?.trim() ?? '';
    const slug = formValue.slug?.trim() ?? '';
    const description = formValue.description?.trim() ?? '';

    return {
      name: name || 'Sin nombre',
      slug: slug || 'Se genera automaticamente',
      description: description || 'Explora todos los productos de esta marca.',
      status:
        this.statusOptions.find((item) => item.value === formValue.status)?.label ||
        'Activa',
      featured: formValue.isFeatured,
    };
  });

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/marcas'], {
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

  selectPreset(color: string): void {
    this.form.controls.backgroundColor.setValue(color);
    this.form.controls.backgroundColor.markAsDirty();
    this.form.controls.backgroundColor.markAsTouched();
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

    this.saving.set(true);

    this.brandsService
      .create(
        {
          name: this.form.controls.name.value.trim(),
          slug: this.emptyToUndefined(this.form.controls.slug.value),
          description: this.emptyToUndefined(this.form.controls.description.value),
          status: this.form.controls.status.value,
          isFeatured: this.form.controls.isFeatured.value,
          backgroundColor: this.form.controls.backgroundColor.value,
        },
        this.selectedImage()!,
      )
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (brand) => {
          this.toastService.success('Marca creada', `La marca "${brand.name}" fue creada correctamente.`);
          this.router.navigate(['/admin/marcas', brand.id], {
            queryParams: { created: brand.id },
          });
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo crear la marca');
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

  private emptyToUndefined(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private setImage(file: File | null): void {
    const previousPreview = this.previewUrl();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    this.selectedImage.set(file);
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
  }
}

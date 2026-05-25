import { Location, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { SafeHtmlPipe } from '../../../../../shared/pipes/safe-html.pipe';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AdminProductsService } from '../../../services/admin-products.service';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import type {
  AdminProductDetail,
  AdminProductImageItem,
  AdminProductSpecificationItem,
  AdminProductVideoItem,
} from '../../../interfaces/admin-product.interface';

type ReorderSection = 'images' | 'videos' | 'specifications';
type ReorderItem = {
  id: string;
  order: number;
};

type ReorderEntity =
  | AdminProductImageItem
  | AdminProductVideoItem
  | AdminProductSpecificationItem;

type ReorderState = {
  mode: ReturnType<typeof signal<boolean>>;
  saving: ReturnType<typeof signal<boolean>>;
  draft: ReturnType<typeof signal<ReorderEntity[] | null>>;
  baseline: ReturnType<typeof signal<string[] | null>>;
  draggedId: ReturnType<typeof signal<string | null>>;
  dragOverId: ReturnType<typeof signal<string | null>>;
};

const PRODUCT_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

@Component({
  selector: 'product-detail-page',
  standalone: true,
  imports: [
    Breadcrumb,
    LocaleDatePipe,
    SafeHtmlPipe,
    HasPermissionDirective,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(AdminProductsService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly refreshTick = signal(0);

  private readonly imageState = this.createReorderState();
  private readonly videoState = this.createReorderState();
  private readonly specificationState = this.createReorderState();

  readonly term = toSignal(this.route.paramMap.pipe(map((params) => params.get('term'))), {
    initialValue: this.route.snapshot.paramMap.get('term'),
  });

  readonly product = toSignal(
    toObservable(
      computed(() => ({
        term: this.term(),
        refreshTick: this.refreshTick(),
      })),
    ).pipe(
      switchMap((term) => {
        if (!term.term) {
          this.loading.set(false);
          this.error.set('Producto no especificado');
          return of(null as AdminProductDetail | null);
        }

        this.loading.set(true);
        this.error.set(null);

        return this.service.findOne(term.term).pipe(
          map((product) => {
            this.loading.set(false);
            return {
              ...product,
              images: product.images.map((image) => ({
                ...image,
                url: image.url || PRODUCT_IMAGE_PLACEHOLDER,
              })),
            };
          }),
          catchError((err) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró el producto');
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null as AdminProductDetail | null },
  );

  readonly statusBadge = computed(() => {
    const product = this.product();

    if (!product) {
      return { label: 'Sin estado', variant: 'neutral' as const };
    }

    if (product.deletedAt) {
      return { label: 'Eliminado', variant: 'deleted' as const };
    }

    switch (product.status) {
      case 'active':
        return { label: 'Activo', variant: 'active' as const };
      case 'inactive':
        return { label: 'Inactivo', variant: 'inactive' as const };
      default:
        return { label: 'Deprecado', variant: 'deprecated' as const };
    }
  });

  readonly coverImage = computed(
    () => this.visibleImages()[0]?.url || PRODUCT_IMAGE_PLACEHOLDER,
  );

  readonly visibleImages = computed<AdminProductImageItem[]>(() => {
    const draft = this.imageState.draft();
    if (this.imageState.mode() && draft) {
      return draft as AdminProductImageItem[];
    }

    return this.product()?.images ?? [];
  });

  readonly visibleVideos = computed<AdminProductVideoItem[]>(() => {
    const draft = this.videoState.draft();
    if (this.videoState.mode() && draft) {
      return draft as AdminProductVideoItem[];
    }

    return this.product()?.videos ?? [];
  });

  readonly visibleSpecifications = computed<AdminProductSpecificationItem[]>(() => {
    const draft = this.specificationState.draft();
    if (this.specificationState.mode() && draft) {
      return draft as AdminProductSpecificationItem[];
    }

    return this.product()?.specifications ?? [];
  });

  readonly canReorderImages = computed(() => this.visibleImages().length > 1);
  readonly canReorderVideos = computed(() => this.visibleVideos().length > 1);
  readonly canReorderSpecifications = computed(
    () => this.visibleSpecifications().length > 1,
  );

  readonly imageReorderMode = computed(() => this.imageState.mode());
  readonly videoReorderMode = computed(() => this.videoState.mode());
  readonly specificationReorderMode = computed(() => this.specificationState.mode());

  readonly imageReordering = computed(() => this.imageState.saving());
  readonly videoReordering = computed(() => this.videoState.saving());
  readonly specificationReordering = computed(() => this.specificationState.saving());

  readonly canSaveImageReorder = computed(() => this.canSaveReorder(this.imageState));
  readonly canSaveVideoReorder = computed(() => this.canSaveReorder(this.videoState));
  readonly canSaveSpecificationReorder = computed(() =>
    this.canSaveReorder(this.specificationState),
  );

  readonly heroBadges = computed(() => {
    const product = this.product();
    if (!product) return [] as string[];

    return [
      product.isFeatured ? 'Destacado' : null,
      product.isNew ? 'Nuevo' : null,
      product.isTrending ? 'Tendencia' : null,
    ].filter((value): value is string => !!value);
  });

  constructor() {
    effect(() => {
      const product = this.product();
      if (product?.videos?.length) {
        setTimeout(() => {
          const oldScript = document.getElementById('tiktok-embed-script-admin');
          if (oldScript) oldScript.remove();
          const script = document.createElement('script');
          script.id = 'tiktok-embed-script-admin';
          script.src = 'https://www.tiktok.com/embed.js';
          script.async = true;
          document.body.appendChild(script);
        }, 150);
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/productos'], {
      queryParamsHandling: 'preserve',
    });
  }

  deleteProduct(): void {
    const product = this.product();
    if (!product || !!product.deletedAt) return;

    this.dialogService
      .confirm({
        title: 'Eliminar Producto',
        message: `¿Estas seguro de eliminar el producto "${product.title}"? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(product.id).subscribe({
          next: () => {
            this.toastService.success(
              'Producto eliminado',
              `El producto "${product.title}" fue eliminado correctamente.`,
            );
            this.router.navigate(['/admin/productos'], {
              queryParamsHandling: 'preserve',
            });
          },
          error: (err) => {
            this.error.set(
              err?.error?.message ?? err?.message ?? 'No se pudo eliminar el producto',
            );
          },
        });
      });
  }

  editProduct(): void {
    const product = this.product();
    if (!product || !!product.deletedAt) return;

    this.router.navigate(['/admin/productos', product.id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  startImageReorder(): void {
    this.startReorder('images');
  }

  cancelImageReorder(): void {
    this.cancelReorder('images');
  }

  saveImageReorder(): void {
    const product = this.product();
    const draft = this.imageState.draft();
    if (!product || !draft || !this.canSaveImageReorder() || this.imageState.saving()) return;

    this.imageState.saving.set(true);
    this.service.reorderImages(product.id, { imageIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.imageState.saving.set(false);
        this.cancelReorder('images');
        this.toastService.success('Orden actualizado', 'Las imagenes fueron reordenadas correctamente.');
        this.refreshTick.update((value) => value + 1);
      },
      error: (err) => {
        this.imageState.saving.set(false);
        this.toastService.error(
          'No se pudo reordenar',
          err?.error?.message ?? err?.message ?? 'No se pudo reordenar las imagenes',
        );
      },
    });
  }

  startVideoReorder(): void {
    this.startReorder('videos');
  }

  cancelVideoReorder(): void {
    this.cancelReorder('videos');
  }

  saveVideoReorder(): void {
    const product = this.product();
    const draft = this.videoState.draft();
    if (!product || !draft || !this.canSaveVideoReorder() || this.videoState.saving()) return;

    this.videoState.saving.set(true);
    this.service.reorderVideos(product.id, { videoIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.videoState.saving.set(false);
        this.cancelReorder('videos');
        this.toastService.success('Orden actualizado', 'Los videos fueron reordenados correctamente.');
        this.refreshTick.update((value) => value + 1);
      },
      error: (err) => {
        this.videoState.saving.set(false);
        this.toastService.error(
          'No se pudo reordenar',
          err?.error?.message ?? err?.message ?? 'No se pudo reordenar los videos',
        );
      },
    });
  }

  startSpecificationReorder(): void {
    this.startReorder('specifications');
  }

  cancelSpecificationReorder(): void {
    this.cancelReorder('specifications');
  }

  saveSpecificationReorder(): void {
    const product = this.product();
    const draft = this.specificationState.draft();
    if (
      !product ||
      !draft ||
      !this.canSaveSpecificationReorder() ||
      this.specificationState.saving()
    ) {
      return;
    }

    this.specificationState.saving.set(true);
    this.service
      .reorderSpecifications(product.id, {
        specificationIds: draft.map((item) => item.id),
      })
      .subscribe({
        next: () => {
          this.specificationState.saving.set(false);
          this.cancelReorder('specifications');
          this.toastService.success(
            'Orden actualizado',
            'Las especificaciones fueron reordenadas correctamente.',
          );
          this.refreshTick.update((value) => value + 1);
        },
        error: (err) => {
          this.specificationState.saving.set(false);
          this.toastService.error(
            'No se pudo reordenar',
            err?.error?.message ?? err?.message ?? 'No se pudo reordenar las especificaciones',
          );
        },
      });
  }

  moveImage(index: number, direction: -1 | 1): void {
    this.moveItem('images', index, direction);
  }

  moveVideo(index: number, direction: -1 | 1): void {
    this.moveItem('videos', index, direction);
  }

  moveSpecification(index: number, direction: -1 | 1): void {
    this.moveItem('specifications', index, direction);
  }

  onImageDragStart(event: DragEvent, id: string): void {
    this.onDragStart('images', event, id);
  }

  onImageDragOver(event: DragEvent): void {
    this.onDragOver('images', event);
  }

  onImageDragEnter(id: string): void {
    this.onDragEnter('images', id);
  }

  onImageDrop(event: DragEvent, id: string): void {
    this.onDrop('images', event, id);
  }

  onImageDragEnd(): void {
    this.onDragEnd('images');
  }

  isImageDragging(id: string): boolean {
    return this.isDragging('images', id);
  }

  isImageDragOver(id: string): boolean {
    return this.isDragOver('images', id);
  }

  onVideoDragStart(event: DragEvent, id: string): void {
    this.onDragStart('videos', event, id);
  }

  onVideoDragOver(event: DragEvent): void {
    this.onDragOver('videos', event);
  }

  onVideoDragEnter(id: string): void {
    this.onDragEnter('videos', id);
  }

  onVideoDrop(event: DragEvent, id: string): void {
    this.onDrop('videos', event, id);
  }

  onVideoDragEnd(): void {
    this.onDragEnd('videos');
  }

  isVideoDragging(id: string): boolean {
    return this.isDragging('videos', id);
  }

  isVideoDragOver(id: string): boolean {
    return this.isDragOver('videos', id);
  }

  onSpecificationDragStart(event: DragEvent, id: string): void {
    this.onDragStart('specifications', event, id);
  }

  onSpecificationDragOver(event: DragEvent): void {
    this.onDragOver('specifications', event);
  }

  onSpecificationDragEnter(id: string): void {
    this.onDragEnter('specifications', id);
  }

  onSpecificationDrop(event: DragEvent, id: string): void {
    this.onDrop('specifications', event, id);
  }

  onSpecificationDragEnd(): void {
    this.onDragEnd('specifications');
  }

  isSpecificationDragging(id: string): boolean {
    return this.isDragging('specifications', id);
  }

  isSpecificationDragOver(id: string): boolean {
    return this.isDragOver('specifications', id);
  }

  private createReorderState(): ReorderState {
    return {
      mode: signal(false),
      saving: signal(false),
      draft: signal<ReorderEntity[] | null>(null),
      baseline: signal<string[] | null>(null),
      draggedId: signal<string | null>(null),
      dragOverId: signal<string | null>(null),
    };
  }

  private getState(section: ReorderSection) {
    switch (section) {
      case 'images':
        return this.imageState;
      case 'videos':
        return this.videoState;
      default:
        return this.specificationState;
    }
  }

  private startReorder(section: ReorderSection): void {
    const items =
      section === 'images'
        ? this.visibleImages()
        : section === 'videos'
          ? this.visibleVideos()
          : this.visibleSpecifications();

    if (items.length < 2) return;

    const state = this.getState(section);
    state.mode.set(true);
    state.draft.set(items.map((item) => ({ ...item })));
    state.baseline.set(items.map((item) => item.id));
  }

  private cancelReorder(section: ReorderSection): void {
    const state = this.getState(section);
    state.mode.set(false);
    state.draft.set(null);
    state.baseline.set(null);
    state.draggedId.set(null);
    state.dragOverId.set(null);
  }

  private canSaveReorder(state: ReorderState): boolean {
    const draft = state.draft();
    const baseline = state.baseline();
    if (!state.mode() || !draft || !baseline || draft.length !== baseline.length) return false;

    return draft.some((item: ReorderEntity, index: number) => item.id !== baseline[index]);
  }

  private moveItem(section: ReorderSection, index: number, direction: -1 | 1): void {
    const state = this.getState(section);
    const draft = state.draft();
    if (!state.mode() || !draft) return;

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.length) return;

    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(index, 1);
    if (!moved) return;

    nextDraft.splice(nextIndex, 0, moved);
    state.draft.set(nextDraft);
  }

  private onDragStart(section: ReorderSection, event: DragEvent, id: string): void {
    const state = this.getState(section);
    if (!state.mode()) {
      event.preventDefault();
      return;
    }

    state.draggedId.set(id);
    state.dragOverId.set(id);
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  private onDragOver(section: ReorderSection, event: DragEvent): void {
    if (!this.getState(section).mode()) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  private onDragEnter(section: ReorderSection, id: string): void {
    const state = this.getState(section);
    if (!state.mode()) return;
    state.dragOverId.set(id);
  }

  private onDrop(section: ReorderSection, event: DragEvent, targetId: string): void {
    const state = this.getState(section);
    if (!state.mode()) return;

    event.preventDefault();

    const draft = state.draft();
    const draggedId = state.draggedId() || event.dataTransfer?.getData('text/plain') || null;
    if (!draft || !draggedId) {
      this.onDragEnd(section);
      return;
    }

    const fromIndex = draft.findIndex((item) => item.id === draggedId);
    const toIndex = draft.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      this.onDragEnd(section);
      return;
    }

    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) {
      this.onDragEnd(section);
      return;
    }

    nextDraft.splice(toIndex, 0, moved);
    state.draft.set(nextDraft);
    this.onDragEnd(section);
  }

  private onDragEnd(section: ReorderSection): void {
    const state = this.getState(section);
    state.draggedId.set(null);
    state.dragOverId.set(null);
  }

  private isDragging(section: ReorderSection, id: string): boolean {
    return this.getState(section).draggedId() === id;
  }

  private isDragOver(section: ReorderSection, id: string): boolean {
    return this.getState(section).dragOverId() === id;
  }
}

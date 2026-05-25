import { CommonModule, Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AdminCategoriesService } from '../../../services/admin-categories.service';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import type {
  AdminCategoryBase,
  AdminCategoryDetail,
  AdminCategoryTreeNode,
} from '../../../interfaces/admin-category.interface';
import type { Datum } from '../../../../03-commerce/ecommerce/pages/categories-page/interfaces/categories-response.interface';
import { CategoryTreeNode as EcommerceCategoryTreeNode } from '../../../../03-commerce/ecommerce/components/category-tree-node/category-tree-node.component';

const CATEGORY_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

interface DetailChildItem extends AdminCategoryBase {
  imageSrc: string;
  descendantsCount: number;
}

@Component({
  selector: 'category-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    Breadcrumb,
    LocaleDatePipe,
    HasPermissionDirective,
    RouterLink,
    EcommerceCategoryTreeNode,
  ],
  templateUrl: './category-detail.html',
  styleUrl: './category-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(AdminCategoriesService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly refreshTick = signal(0);
  readonly childReorderMode = signal(false);
  readonly childReordering = signal(false);
  readonly childReorderDraft = signal<DetailChildItem[] | null>(null);
  readonly childReorderBaseline = signal<string[] | null>(null);
  readonly draggedChildId = signal<string | null>(null);
  readonly dragOverChildId = signal<string | null>(null);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly categoryId = computed(() => this.paramMap().get('id') ?? '');
  private readonly detailRequest$ = toObservable(
    computed(() =>
      JSON.stringify({
        id: this.categoryId(),
        refreshTick: this.refreshTick(),
      }),
    ),
  ).pipe(
    distinctUntilChanged(),
    switchMap((payload) => {
      const parsed: { id: string } = JSON.parse(payload);
      if (!parsed.id) {
        this.loading.set(false);
        this.error.set('Categoria no especificada');
        return of(null as AdminCategoryDetail | null);
      }

      this.loading.set(true);
      this.error.set(null);
      this.cancelChildReorder();

      return this.service.findOne(parsed.id).pipe(
        map((detail) => {
          this.loading.set(false);
          return {
            ...detail,
            category: {
              ...detail.category,
              imageUrl:
                detail.category.imageUrl || detail.category.image || CATEGORY_IMAGE_PLACEHOLDER,
              image: detail.category.image || detail.category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER,
            },
          };
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró la categoria');
          return of(null);
        }),
      );
    }),
  );

  readonly detail = toSignal(this.detailRequest$, { initialValue: null as AdminCategoryDetail | null });
  readonly category = computed(() => this.detail()?.category ?? null);
  readonly directChildren = computed<DetailChildItem[]>(() => {
    const detail = this.detail();
    if (!detail?.children?.length) return [];

    return detail.children.map((child) => {
      const treeNode = detail.fullTree.children.find((node) => node.id === child.id) ?? null;
      return {
        ...child,
        imageSrc: child.imageUrl || child.image || CATEGORY_IMAGE_PLACEHOLDER,
        descendantsCount: treeNode ? this.countDescendants(treeNode) : 0,
      };
    });
  });
  readonly visibleChildren = computed<DetailChildItem[]>(() => {
    const draft = this.childReorderDraft();
    if (this.childReorderMode() && draft) {
      return draft;
    }

    return this.directChildren();
  });
  readonly descendantsCount = computed(() => {
    const detail = this.detail();
    if (!detail?.fullTree?.children?.length) return 0;
    return this.countDescendants(detail.fullTree);
  });
  readonly canReorderChildren = computed(() => this.directChildren().length > 1);
  readonly canSaveChildReorder = computed(() => {
    const draft = this.childReorderDraft();
    const baseline = this.childReorderBaseline();
    if (!this.childReorderMode() || !draft || !baseline || draft.length !== baseline.length) return false;

    return draft.some((item, index) => item.id !== baseline[index]);
  });
  readonly fullTreeData = computed<Datum[]>(() => {
    const detail = this.detail();
    return detail?.fullTree ? [this.toDatum(detail.fullTree)] : [];
  });

  readonly statusBadge = computed(() => {
    const detail = this.detail();
    const category = detail?.category;

    if (!category) {
      return { label: 'Sin estado', variant: 'neutral' as const };
    }

    if (category.deletedAt) {
      return { label: 'Eliminada', variant: 'deleted' as const };
    }

    if (category.status === 'active') {
      return { label: 'Activa', variant: 'active' as const };
    }

    if (category.status === 'inactive') {
      return { label: 'Inactiva', variant: 'inactive' as const };
    }

    return { label: 'Deprecada', variant: 'deprecated' as const };
  });

  readonly summaryItems = computed(() => {
    const detail = this.detail();
    if (!detail) return [];

    return [
      { label: 'Nivel', value: String(detail.category.level) },
      { label: 'Orden', value: String(detail.category.order) },
      { label: 'Hijos directos', value: String(detail.children.length) },
      { label: 'Descendientes', value: String(this.descendantsCount()) },
    ];
  });

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/categorias'], { queryParamsHandling: 'preserve' });
  }

  editCategory(): void {
    const detail = this.detail();
    if (!detail || detail.category.deletedAt) return;

    this.router.navigate(['/admin/categorias', detail.category.id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  viewCategory(id: string): void {
    this.router.navigate(['/admin/categorias', id], { queryParamsHandling: 'preserve' });
  }

  onFullTreeNodeSelected(node: Datum): void {
    this.viewCategory(node.id);
  }

  onFullTreeView(node: Datum): void {
    this.viewCategory(node.id);
  }

  onFullTreeEdit(node: Datum): void {
    this.editCategoryById(node.id);
  }

  onFullTreeDelete(node: Datum): void {
    this.deleteCategoryById(node.id, node.name);
  }

  editCategoryById(id: string): void {
    this.router.navigate(['/admin/categorias', id, 'editar'], { queryParamsHandling: 'preserve' });
  }

  deleteCategoryById(id: string, name: string): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Categoria',
        message: `¿Estas seguro de eliminar la categoria "${name}"? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(id).subscribe({
          next: () => {
            const currentId = this.detail()?.category.id;

            this.toastService.success('Categoria eliminada', `La categoria "${name}" fue eliminada correctamente.`);

            if (currentId === id) {
              this.router.navigate(['/admin/categorias'], { queryParamsHandling: 'preserve' });
              return;
            }

            this.refreshTick.update((value) => value + 1);
          },
          error: (err) => {
            this.toastService.error(
              'No se pudo eliminar',
              err?.error?.message ?? err?.message ?? 'No se pudo eliminar la categoria',
            );
          },
        });
      });
  }

  startChildReorder(): void {
    const children = this.directChildren();
    if (children.length < 2) return;

    this.childReorderMode.set(true);
    this.childReorderDraft.set(children.map((child) => ({ ...child })));
    this.childReorderBaseline.set(children.map((child) => child.id));
  }

  cancelChildReorder(): void {
    this.childReorderMode.set(false);
    this.childReorderDraft.set(null);
    this.childReorderBaseline.set(null);
    this.draggedChildId.set(null);
    this.dragOverChildId.set(null);
  }

  saveChildReorder(): void {
    const detail = this.detail();
    const draft = this.childReorderDraft();
    if (!detail || !draft || !this.canSaveChildReorder() || this.childReordering()) return;

    this.childReordering.set(true);

    this.service.reorder({ categoryIds: draft.map((item) => item.id) }).subscribe({
      next: () => {
        this.childReordering.set(false);
        this.cancelChildReorder();
        this.toastService.success(
          'Orden actualizado',
          `Los hijos de "${detail.category.name}" fueron reordenados correctamente.`,
        );
        this.refreshTick.update((value) => value + 1);
      },
      error: (err) => {
        this.childReordering.set(false);
        this.toastService.error(
          'No se pudo reordenar',
          err?.error?.message ?? err?.message ?? 'No se pudo reordenar las subcategorias',
        );
      },
    });
  }

  moveChild(fromIndex: number, direction: -1 | 1): void {
    const draft = this.childReorderDraft();
    if (!this.childReorderMode() || !draft) return;

    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= draft.length) return;

    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) return;

    nextDraft.splice(toIndex, 0, moved);
    this.childReorderDraft.set(nextDraft);
  }

  onChildDragStart(event: DragEvent, childId: string): void {
    if (!this.childReorderMode()) {
      event.preventDefault();
      return;
    }

    this.draggedChildId.set(childId);
    this.dragOverChildId.set(childId);
    event.dataTransfer?.setData('text/plain', childId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onChildDragOver(event: DragEvent): void {
    if (!this.childReorderMode()) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onChildDragEnter(childId: string): void {
    if (!this.childReorderMode()) return;
    this.dragOverChildId.set(childId);
  }

  onChildDrop(event: DragEvent, targetChildId: string): void {
    if (!this.childReorderMode()) return;

    event.preventDefault();

    const draft = this.childReorderDraft();
    const draggedChildId = this.draggedChildId() || event.dataTransfer?.getData('text/plain') || null;
    if (!draft || !draggedChildId) {
      this.onChildDragEnd();
      return;
    }

    const fromIndex = draft.findIndex((item) => item.id === draggedChildId);
    const toIndex = draft.findIndex((item) => item.id === targetChildId);

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      this.onChildDragEnd();
      return;
    }

    const nextDraft = [...draft];
    const [moved] = nextDraft.splice(fromIndex, 1);
    if (!moved) {
      this.onChildDragEnd();
      return;
    }

    nextDraft.splice(toIndex, 0, moved);
    this.childReorderDraft.set(nextDraft);
    this.onChildDragEnd();
  }

  onChildDragEnd(): void {
    this.draggedChildId.set(null);
    this.dragOverChildId.set(null);
  }

  isChildDragging(childId: string): boolean {
    return this.draggedChildId() === childId;
  }

  isChildDragOver(childId: string): boolean {
    return this.dragOverChildId() === childId;
  }

  deleteCategory(): void {
    const detail = this.detail();
    if (!detail || detail.category.deletedAt) return;

    this.deleteCategoryById(detail.category.id, detail.category.name);
  }

  private countDescendants(node: AdminCategoryTreeNode): number {
    return (node.children ?? []).reduce((total, child) => total + 1 + this.countDescendants(child), 0);
  }

  private toDatum(node: AdminCategoryTreeNode): Datum {
    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      description: node.description ?? '',
      image: node.imageUrl || node.image || CATEGORY_IMAGE_PLACEHOLDER,
      order: node.order,
      level: node.level,
      status: node.status,
      isFeatured: node.isFeatured,
      children: (node.children ?? []).map((child) => this.toDatum(child)),
    };
  }
}

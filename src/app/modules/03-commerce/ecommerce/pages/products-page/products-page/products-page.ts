import { Component, computed, inject, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { switchMap, of } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';

import { ProductCard } from '../../../components/product-card/product-card';
import { SkeletonCard } from '../../../../../../shared/components/skeleton-card/skeleton-card';
import { ProductsService, SortByProductsPublic } from '../../../services/products.service';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { TreeFilterComponent, TreeNode } from './components/tree-filter/tree-filter';
import { ListFilterComponent, FilterItem } from './components/list-filter/list-filter';
import { MobileFilterDrawerComponent } from './components/mobile-filter-drawer/mobile-filter-drawer';
import { ActiveFilterChipsComponent, ActiveFilter } from './components/active-filter-chips/active-filter-chips';
import { BrandsResponse, Datum as BrandDatum } from '../../brands-page/interfaces/brands-response.interface';
import { Datum as CategoryDatum, CategoriesResponse } from '../../categories-page/interfaces/categories-response.interface';

@Component({
  selector: 'products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCard, SkeletonCard, PaginationComponent, TreeFilterComponent, ListFilterComponent, MobileFilterDrawerComponent, ActiveFilterChipsComponent],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mobileDrawerOpen = signal(false);

  readonly categoriesResource = rxResource<CategoriesResponse, void>({
    stream: () => this.productsService.getTreeCategories(),
  });

  readonly categories = computed((): TreeNode[] => {
    const data = this.categoriesResource.value()?.data ?? [];
    return this.mapCategoriesToSlugs(data);
  });

  readonly brandsResource = rxResource<BrandsResponse, { categories: string | null; search: string | null }>({
    params: () => ({
      categories: this.category(),
      search: this.search(),
    }),
    stream: ({ params }) => {
      const categorySlugs = params.categories ? params.categories.split(',').filter(Boolean) : [];
      return this.productsService.getBrandsByCategories(categorySlugs, params.search || undefined).pipe(
        switchMap(response => {
          if (response.data.length === 0 && (params.categories || params.search)) {
            return this.productsService.getBrandsByCategories([], undefined);
          }
          return of(response);
        })
      );
    },
  });

  readonly brands = computed((): FilterItem[] => {
    const data = this.brandsResource.value()?.data ?? [];
    return data.map(brand => ({ id: brand.slug, name: brand.name }));
  });

  private mapCategoriesToSlugs(categories: CategoryDatum[]): TreeNode[] {
    return categories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      children: cat.children ? this.mapCategoriesToSlugs(cat.children) : [],
    }));
  }

  private readonly urlParams = toSignal(this.route.queryParamMap);
  readonly page = computed(() => Number(this.urlParams()?.get('page')) || 1);
  readonly category = computed(() => this.urlParams()?.get('category') || null);
  readonly brand = computed(() => this.urlParams()?.get('brand') || null);
  readonly sortBy = computed(() => this.urlParams()?.get('sortBy') || null);
  readonly order = computed(() => this.urlParams()?.get('order') || null);
  readonly isFeatured = computed(() => this.urlParams()?.get('isFeatured') === 'true');
  readonly isTrending = computed(() => this.urlParams()?.get('isTrending') === 'true');
  readonly isNew = computed(() => this.urlParams()?.get('isNew') === 'true');
  readonly search = computed(() => this.urlParams()?.get('search') || null);
  readonly productIds = computed(() => this.urlParams()?.get('productIds') || null);

  constructor() {
    effect(() => {
      if (this.brandsResource.isLoading()) return;

      const availableBrands = this.brands();
      if (availableBrands.length === 0 && this.category()) {
        if (this.brand()) this.navegar({ brand: null });
        return;
      }

      const availableIds = new Set(availableBrands.map(b => b.id));
      const currentSelected = this.brand() ? this.brand()!.split(',') : [];

      if (currentSelected.length === 0) return;

      const validSelected = currentSelected.filter(id => availableIds.has(id));

      if (validSelected.length !== currentSelected.length) {
        this.navegar({
          brand: validSelected.length > 0 ? validSelected.join(',') : null,
        });
      }
    });
  }

  readonly productsResource = rxResource({
    params: () => ({
      page: this.page(),
      category: this.category(),
      brand: this.brand(),
      sortBy: this.sortBy(),
      order: this.order(),
      isFeatured: this.isFeatured(),
      isTrending: this.isTrending(),
      isNew: this.isNew(),
      search: this.search(),
      productIds: this.productIds(),
    }),
    stream: ({ params }) => {
      const limit = 12;
      const offset = (params.page - 1) * limit;

      return this.productsService.getProducts({
        limit,
        offset,
        categories: params.category ? params.category.split(',').filter(Boolean) : undefined,
        brands: params.brand ? params.brand.split(',').filter(Boolean) : undefined,
        productIds: params.productIds ? params.productIds.split(',').filter(Boolean) : undefined,
        sortBy: params.sortBy as SortByProductsPublic | undefined,
        order: params.order as 'ASC' | 'DESC' | undefined,
        isFeatured: params.isFeatured || undefined,
        isTrending: params.isTrending || undefined,
        isNew: params.isNew || undefined,
        search: params.search || undefined,
      });
    },
  });

  readonly products = computed(() => this.productsResource.value()?.data ?? []);
  readonly meta = computed(() => this.productsResource.value()?.meta);
  readonly isLoading = computed(() => this.productsResource.isLoading());

  handlePageChange(nuevaPagina: number): void {
    this.navegar({ page: nuevaPagina });
  }

  handleFavorite(_productId: string): void {
    // TODO: Favorite service
  }


  handleSelectionChange(categories: string[]): void {
    this.navegar({ category: categories.length > 0 ? categories.join(',') : null, page: 1 });
  }

  handleBrandSelectionChange(brands: string[]): void {
    this.navegar({ brand: brands.length > 0 ? brands.join(',') : null, page: 1 });
  }

  handleSortChange(sortBy: string | null): void {
    this.navegar({ sortBy: sortBy || null, page: 1 });
  }

  handleOrderChange(order: string | null): void {
    this.navegar({ order: order || null, page: 1 });
  }

  toggleFlag(selectedFlag: 'isFeatured' | 'isTrending' | 'isNew', value: boolean): void {
    this.navegar({
      page: 1,
      isFeatured: selectedFlag === 'isFeatured' && value ? 'true' : null,
      isTrending: selectedFlag === 'isTrending' && value ? 'true' : null,
      isNew: selectedFlag === 'isNew' && value ? 'true' : null,
    });
  }

  resetFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
    });
  }

  isAnyFilterApplied = computed(() => {
    return !!(
      this.category() || this.brand() || this.sortBy() || this.order() ||
      this.isFeatured() || this.isTrending() || this.isNew() ||
      this.search() || this.productIds()
    );
  });

  readonly activeFilterChips = computed((): ActiveFilter[] => {
    const chips: ActiveFilter[] = [];

    if (this.category()) {
      const categorySlugs = this.category()!.split(',');
      for (const slug of categorySlugs) {
        const category = this.findCategoryName(this.categories(), slug);
        if (category) {
          chips.push({ id: `cat-${slug}`, label: category, type: 'category' });
        }
      }
    }

    if (this.brand()) {
      const brandSlugs = this.brand()!.split(',');
      for (const slug of brandSlugs) {
        const brand = this.brands().find(b => b.id === slug);
        if (brand) {
          chips.push({ id: `brand-${slug}`, label: brand.name, type: 'brand' });
        }
      }
    }

    return chips;
  });

  private findCategoryName(categories: TreeNode[], slug: string): string | null {
    for (const cat of categories) {
      if (cat.id === slug) return cat.name;
      if (cat.children) {
        const found = this.findCategoryName(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  }

  handleRemoveFilter(filterId: string): void {
    if (filterId.startsWith('cat-')) {
      const slug = filterId.replace('cat-', '');
      const currentCategories = this.category() ? this.category()!.split(',').filter(c => c !== slug) : [];
      this.navegar({ category: currentCategories.length > 0 ? currentCategories.join(',') : null, page: 1 });
    } else if (filterId.startsWith('brand-')) {
      const slug = filterId.replace('brand-', '');
      const currentBrands = this.brand() ? this.brand()!.split(',').filter(b => b !== slug) : [];
      this.navegar({ brand: currentBrands.length > 0 ? currentBrands.join(',') : null, page: 1 });
    }
  }

  handleClearAllFilters(): void {
    this.navegar({ category: null, brand: null, page: 1 });
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update(v => !v);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  navegar(params: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}

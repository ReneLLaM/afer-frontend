import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbService } from './breadcrumb.service';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);
  private destroyRef = inject(DestroyRef);

  routeBreadcrumbs = signal<BreadcrumbItem[]>([]);
  currentUrl = signal<string>('');

  displayBreadcrumbs = computed(() => {
    const currentPath = this.currentUrl().split(/[?#]/)[0];
    if (currentPath === '/' || currentPath === '') {
      return [];
    }

    const dynamicLabels = this.breadcrumbService.dynamicLabels();
    return this.routeBreadcrumbs().map(b => ({
      ...b,
      label: dynamicLabels[b.url] || b.label,
    }));
  });

  constructor() {
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        const navEnd = event as NavigationEnd;
        this.currentUrl.set(navEnd.urlAfterRedirects || navEnd.url);
        this.routeBreadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
      });
  }

  private buildBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    const label = route.routeConfig?.data?.['breadcrumb'];
    let path = route.snapshot?.url.map(segment => segment.path).join('/') ?? '';

    if (!path && route.routeConfig?.path) {
      path = route.routeConfig.path;
    }

    const nextUrl = path ? `${url}/${path}` : url;

    if (route.routeConfig?.path === 'productos/:slug') {
      if (!breadcrumbs.some(b => b.url === '/productos')) {
        breadcrumbs.push({ label: 'Productos', url: '/productos' });
      }
    }

    if (label && !breadcrumbs.some(b => b.label === label)) {
      breadcrumbs = [...breadcrumbs, { label, url: nextUrl }];
    }

    if (route.firstChild) {
      return this.buildBreadcrumbs(route.firstChild, nextUrl, breadcrumbs);
    }

    return breadcrumbs;
  }
}

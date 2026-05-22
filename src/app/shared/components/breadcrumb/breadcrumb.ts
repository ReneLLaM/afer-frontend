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
    // Filtrar breadcrumbs que sean redundantes con el icono de inicio
    return this.routeBreadcrumbs()
      .filter(b => {
        const label = b.label.toLowerCase();
        return label !== 'inicio' && label !== 'home' && b.url !== '/';
      })
      .map(b => ({
        ...b,
        label: dynamicLabels[b.url] || b.label,
      }));
  });

  constructor() {
    this.currentUrl.set(this.router.url);
    this.routeBreadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));

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
    const nextRoute = route.firstChild;
    
    if (!nextRoute) {
      return breadcrumbs;
    }

    const snapshot = nextRoute.snapshot;
    if (!snapshot) {
      return this.buildBreadcrumbs(nextRoute, url, breadcrumbs);
    }

    const routeURL: string = snapshot.url.map(segment => segment.path).join('/');
    
    if (routeURL !== '') {
      url += `/${routeURL}`;
    }

    const label = snapshot.data['breadcrumb'];
    if (label && !breadcrumbs.some(b => b.url === url)) {
      breadcrumbs.push({ label, url });
    }

    return this.buildBreadcrumbs(nextRoute, url, breadcrumbs);
  }
}

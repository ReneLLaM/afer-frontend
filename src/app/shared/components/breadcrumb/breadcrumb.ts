import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { BreadcrumbService } from './breadcrumb.service';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);

  // Almacena la estructura base (con slugs o labels por defecto)
  routeBreadcrumbs = signal<BreadcrumbItem[]>([]);
  currentUrl = signal<string>('');

  // Computed reactivo: reemplaza los slugs por los nombres reales si existen en el servicio
  displayBreadcrumbs = computed(() => {
    // Si estamos en el home (ignorando query params o fragments), no mostramos nada
    const currentPath = this.currentUrl().split(/[?#]/)[0];
    if (currentPath === '/' || currentPath === '') {
      return [];
    }

    const dynamicLabels = this.breadcrumbService.dynamicLabels();
    return this.routeBreadcrumbs().map(b => ({
      ...b,
      label: dynamicLabels[b.url] || b.label
    }));
  });

  ngOnInit() {
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
        this.routeBreadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
      });
      
    // Initial load
    this.routeBreadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    let label = route.routeConfig?.data?.['breadcrumb'];
    
    // Get the resolved path from the snapshot
    let path = route.snapshot.url.map(segment => segment.path).join('/');
    
    // Fallback to route config path if snapshot is empty (e.g., for root route '')
    if (!path && route.routeConfig?.path) {
      path = route.routeConfig.path;
    }

    let nextUrl = path ? `${url}/${path}` : url;

    // Inyectamos el nivel "Productos" antes del detalle porque son rutas hermanas
    if (route.routeConfig?.path === 'productos/:slug') {
      if (!breadcrumbs.some(b => b.url === '/productos')) {
        breadcrumbs.push({ label: 'Productos', url: '/productos' });
      }
      // No forzamos el id como label. Usará 'Detalle Producto' temporalmente
      // hasta que el ProductDetailPage establezca el nombre real.
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


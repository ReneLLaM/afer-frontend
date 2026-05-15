import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  HostListener,
  effect,
  inject,
  DOCUMENT,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mobile-filter-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="drawer-overlay" (click)="handleOverlayClick()"></div>
      <aside class="drawer-panel" role="dialog" aria-modal="true">
        <!-- Header fijo -->
        <div class="drawer-header">
          <div class="header-left">
            <h2 class="drawer-title">Filtros</h2>
            @if (selectionCount() > 0) {
              <span class="header-badge">{{ selectionCount() }}</span>
            }
          </div>
          <div class="header-actions">
            @if (selectionCount() > 0) {
              <button class="btn-clear" type="button" (click)="handleClearAll()">
                Limpiar
              </button>
            }
            <button class="btn-close" type="button" (click)="handleClose()" aria-label="Cerrar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tabs de navegación -->
        <div class="drawer-tabs">
          <button
            class="tab-btn"
            [class.is-active]="activeTab() === 'categories'"
            (click)="setTab('categories')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Categorías
            @if (categoryCount() > 0) {
              <span class="tab-count">{{ categoryCount() }}</span>
            }
          </button>
          <button
            class="tab-btn"
            [class.is-active]="activeTab() === 'brands'"
            (click)="setTab('brands')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            Marcas
            @if (brandCount() > 0) {
              <span class="tab-count">{{ brandCount() }}</span>
            }
          </button>
        </div>

        <!-- Contenido con scroll independiente por tab -->
        <div class="drawer-body">
          <div class="tab-panel" [class.is-visible]="activeTab() === 'categories'">
            <ng-content select="[tab-categories]"></ng-content>
          </div>
          <div class="tab-panel" [class.is-visible]="activeTab() === 'brands'">
            <ng-content select="[tab-brands]"></ng-content>
          </div>
        </div>

        <!-- Footer fijo -->
        <div class="drawer-footer">
          <button class="btn-apply" type="button" (click)="handleApply()">
            Ver resultados
            @if (selectionCount() > 0) {
              <span class="apply-badge">{{ selectionCount() }}</span>
            }
          </button>
        </div>
      </aside>
    }
  `,
  styleUrl: './mobile-filter-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileFilterDrawerComponent {
  private document = inject(DOCUMENT);

  isOpen = input<boolean>(false);
  selectionCount = input<number>(0);
  categoryCount = input<number>(0);
  brandCount = input<number>(0);

  closed = output<void>();
  applied = output<void>();
  clearedAll = output<void>();

  readonly activeTab = signal<'categories' | 'brands'>('categories');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.document.body.style.overflow = 'hidden';
      } else {
        this.document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.handleClose();
    }
  }

  setTab(tab: 'categories' | 'brands'): void {
    this.activeTab.set(tab);
  }

  handleOverlayClick(): void {
    this.handleClose();
  }

  handleClose(): void {
    this.closed.emit();
  }

  handleApply(): void {
    this.applied.emit();
    this.closed.emit();
  }

  handleClearAll(): void {
    this.clearedAll.emit();
  }
}

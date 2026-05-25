import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit, DestroyRef } from '@angular/core';
import { Title } from '@angular/platform-browser';


interface Section {
  id: string;
  title: string;
}

@Component({
  selector: 'app-terminos-y-condiciones-page',
  standalone: true,
  templateUrl: './terminos-y-condiciones-page.html',
  styleUrl: './terminos-y-condiciones-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminosYCondicionesPage implements AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections: Section[] = [
    { id: 'informacion-del-proveedor', title: 'Información del Proveedor' },
    { id: 'objeto', title: 'Objeto del Contrato' },
    { id: 'proceso-de-compra', title: 'Proceso de Compra' },
    { id: 'precios-y-pago', title: 'Precios y Formas de Pago' },
    { id: 'entrega-y-plazos', title: 'Entrega y Plazos' },
    { id: 'desistimiento', title: 'Derecho de Desistimiento' },
    { id: 'garantias', title: 'Garantías' },
    { id: 'devoluciones-y-cambios', title: 'Devoluciones y Cambios' },
    { id: 'propiedad-intelectual', title: 'Propiedad Intelectual' },
    { id: 'limitacion', title: 'Limitación de Responsabilidad' },
    { id: 'legislacion', title: 'Legislación Aplicable' },
    { id: 'aceptacion', title: 'Aceptación de los Términos' },
  ];

  activeSection = signal('');

  constructor() {
    this.titleService.setTitle('Términos y Condiciones | AFER Bolivia');
  }

  ngAfterViewInit(): void {
    const contentEl = document.querySelector<HTMLElement>('.legal-content');
    if (!contentEl) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id);
          }
        }
      },
      {
        root: contentEl,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0,
      },
    );

    for (const s of this.sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection.set(id);
    }
  }
}

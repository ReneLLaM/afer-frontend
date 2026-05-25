import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit, DestroyRef } from '@angular/core';
import { Title } from '@angular/platform-browser';


interface Section {
  id: string;
  title: string;
}

@Component({
  selector: 'app-politica-de-envios-page',
  standalone: true,
  templateUrl: './politica-de-envios-page.html',
  styleUrl: './politica-de-envios-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliticaDeEnviosPage implements AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections: Section[] = [
    { id: 'cobertura', title: 'Cobertura Geográfica' },
    { id: 'plazos', title: 'Plazos de Entrega' },
    { id: 'costos', title: 'Costos de Envío' },
    { id: 'seguimiento', title: 'Seguimiento de Pedidos' },
    { id: 'recepcion', title: 'Recepción del Pedido' },
    { id: 'danados', title: 'Productos Dañados o Perdidos' },
    { id: 'envios-internacionales', title: 'Envíos Internacionales' },
  ];

  activeSection = signal('');

  constructor() {
    this.titleService.setTitle('Política de Envíos | AFER Bolivia');
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

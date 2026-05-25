import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit, DestroyRef } from '@angular/core';
import { Title } from '@angular/platform-browser';


interface Section {
  id: string;
  title: string;
}

@Component({
  selector: 'app-politica-de-privacidad-page',
  standalone: true,
  templateUrl: './politica-de-privacidad-page.html',
  styleUrl: './politica-de-privacidad-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliticaDePrivacidadPage implements AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections: Section[] = [
    { id: 'responsable', title: 'Responsable del Tratamiento' },
    { id: 'datos-recopilados', title: 'Datos Recopilados' },
    { id: 'finalidad', title: 'Finalidad del Tratamiento' },
    { id: 'base-legal', title: 'Base Legal' },
    { id: 'destinatarios', title: 'Destinatarios de los Datos' },
    { id: 'transferencia', title: 'Transferencia Internacional' },
    { id: 'conservacion', title: 'Plazo de Conservación' },
    { id: 'derechos-arco', title: 'Derechos ARCO' },
    { id: 'seguridad', title: 'Seguridad de los Datos' },
    { id: 'cookies', title: 'Uso de Cookies' },
    { id: 'cambios', title: 'Cambios a la Política' },
    { id: 'contacto', title: 'Contacto del Responsable' },
  ];

  activeSection = signal('');

  constructor() {
    this.titleService.setTitle('Política de Privacidad | AFER Bolivia');
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

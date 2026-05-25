import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FaqService } from '../../services/faq.service';

@Component({
  selector: 'app-preguntas-frecuentes-page',
  standalone: true,
  imports: [],
  templateUrl: './preguntas-frecuentes-page.html',
  styleUrl: './preguntas-frecuentes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreguntasFrecuentesPage {
  private readonly titleService = inject(Title);
  private readonly faqService = inject(FaqService);
  private readonly _openId = signal<string | null>(null);

  readonly faqItems = this.faqService.faqItems;

  toggleFaq(id: string): void {
    this._openId.set(this._openId() === id ? null : id);
  }

  isFaqOpen(id: string): boolean {
    return this._openId() === id;
  }

  constructor() {
    this.titleService.setTitle('Preguntas Frecuentes | AFER Bolivia');
  }
}

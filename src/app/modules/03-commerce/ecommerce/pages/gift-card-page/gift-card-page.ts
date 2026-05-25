import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-gift-card-page',
  standalone: true,
  imports: [],
  templateUrl: './gift-card-page.html',
  styleUrl: './gift-card-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GiftCardPage {
  private readonly titleService = inject(Title);

  readonly benefits = [
    { icon: 'present', title: 'Elige el monto', desc: 'Desde Bs. 50 hasta Bs. 2.000, tú decides cuánto regalar.' },
    { icon: 'calendar', title: 'Sin fecha de vencimiento', desc: 'La gift card no caduca. El saldo se usa cuando el destinatario prefiera.' },
    { icon: 'phone', title: 'Entrega digital', desc: 'Se envía al correo del destinatario al instante, lista para usar.' },
    { icon: 'heart', title: 'Cualquier producto', desc: 'Canjeable en toda la tienda, tanto física como online.' },
  ];

  readonly steps = [
    { num: '01', title: 'Elige un monto', desc: 'Selecciona el valor que deseas regalar. Puedes personalizar el diseño si lo deseas.' },
    { num: '02', title: 'Personaliza', desc: 'Añade un mensaje especial y elige la fecha de envío.' },
    { num: '03', title: 'Paga y envía', desc: 'Completa el pago y la gift card se envía al correo del destinatario.' },
    { num: '04', title: 'Disfrutan', desc: 'El destinatario recibe su gift card y puede usarla de inmediato en cualquier compra.' },
  ];

  readonly useCases = [
    { icon: 'cake', title: 'Cumpleaños', desc: 'El regalo perfecto cuando no sabes qué comprar. Tu ser querido elige lo que más le guste.' },
    { icon: 'briefcase', title: 'Corporativo', desc: 'Recompensa a tus empleados o clientes con gift cards personalizadas para tu empresa.' },
    { icon: 'heart', title: 'Agradecimiento', desc: 'Un detalle especial para amigos, familiares o cualquier persona a quien quieras sorprender.' },
    { icon: 'graduation', title: 'Graduaciones', desc: 'Celebra los logros con un regalo útil y flexible. Ideal para recién graduados.' },
  ];

  readonly faqItems: FaqItem[] = [
    { question: '¿Cómo se entrega la gift card?', answer: 'Se envía automáticamente al correo electrónico del destinatario con un diseño atractivo y un código único canjeable.', open: false },
    { question: '¿Puedo usarla más de una vez?', answer: 'Sí. El saldo se descuenta de cada compra hasta agotarse. No es necesario usar todo el saldo de una sola vez.', open: false },
    { question: '¿Hay productos excluidos?', answer: 'La gift card es válida para cualquier producto de la tienda, tanto en compras físicas como en línea.', open: false },
    { question: '¿Puedo devolver o reembolsar una gift card?', answer: 'No se aceptan devoluciones ni reembolsos de gift cards una vez emitidas.', open: false },
    { question: '¿Qué pasa si el monto es mayor a la compra?', answer: 'El saldo restante queda disponible para futuras compras. No hay monto mínimo de uso.', open: false },
  ];

  openFaqIndex = signal<number | null>(null);

  constructor() {
    this.titleService.setTitle('Gift Card | AFER Bolivia');
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }
}

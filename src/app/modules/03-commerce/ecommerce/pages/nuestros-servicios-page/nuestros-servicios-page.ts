import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-nuestros-servicios-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nuestros-servicios-page.html',
  styleUrl: './nuestros-servicios-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuestrosServiciosPage {
  private readonly titleService = inject(Title);
  private readonly _openService = signal<string | null>(null);

  readonly newsletterEmail = signal('');

  readonly isEmailValid = () => {
    const email = this.newsletterEmail();
    return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  toggleService(serviceId: string): void {
    const currentOpen = this._openService();
    this._openService.set(currentOpen === serviceId ? null : serviceId);
  }

  isServiceOpen(serviceId: string): boolean {
    return this._openService() === serviceId;
  }

  onSubscribe(): void {
    if (this.isEmailValid()) {
      this.newsletterEmail.set('');
    }
  }

  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.newsletterEmail.set(value);
  }

  constructor() {
    this.titleService.setTitle('Servicios de Ventas y Postventa | AFER Bolivia');
  }
}
import { Component, inject } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'toast',
  standalone: true,
  imports: [NgClass, AsyncPipe],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  private toastService = inject(ToastService);

  // Exponemos el observable directamente al template con async pipe
  toasts$ = this.toastService.toasts$;

  removeToast(id: number) {
    this.toastService.removeToast(id);
  }
}

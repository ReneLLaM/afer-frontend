import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService, Toast as ToastItem } from '../services/toast.service';

@Component({
  selector: 'toast',
  standalone: true,
  imports: [NgClass],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  private toastService = inject(ToastService);

  get toasts(): readonly ToastItem[] {
    return this.toastService.allToasts;
  }

  removeToast(id: number): void {
    this.toastService.removeToast(id);
  }
}

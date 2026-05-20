import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'toast',
  standalone: true,
  imports: [NgClass],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private toastService = inject(ToastService);

  get toasts(): readonly Toast[] {
    return this.toastService.allToasts;
  }

  removeToast(id: number): void {
    this.toastService.removeToast(id);
  }
}

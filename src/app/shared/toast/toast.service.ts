import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  get allToasts() {
    return this.toasts();
  }

  private show(title: string, message: string, type: Toast['type']): number {
    const id = Date.now();
    const toast: Toast = { id, title, message, type };

    this.toasts.update(current => [...current, toast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 4000);

    return id;
  }

  removeToast(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  success(title: string, message: string): number { return this.show(title, message, 'success'); }
  error(title: string, message: string): number { return this.show(title, message, 'error'); }
  info(title: string, message: string): number { return this.show(title, message, 'info'); }
  warning(title: string, message: string): number { return this.show(title, message, 'warning'); }
}

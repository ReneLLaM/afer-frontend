import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  private toastSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastSubject.asObservable();

  private show(title: string, message: string, type: Toast['type']) {
    const id = Date.now();
    const toast: Toast = { id, title, message, type };

    // Creamos un nuevo array (inmutabilidad) para que Angular detecte el cambio
    this.toastSubject.next([...this.toastSubject.value, toast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 4000);

    return id;
  }

  removeToast(id: number) {
    const current = this.toastSubject.value.filter(t => t.id !== id);
    this.toastSubject.next(current);
  }

  success(title: string, message: string) { return this.show(title, message, 'success'); }
  error(title: string, message: string)   { return this.show(title, message, 'error'); }
  info(title: string, message: string)    { return this.show(title, message, 'info'); }
  warning(title: string, message: string) { return this.show(title, message, 'warning'); }
}

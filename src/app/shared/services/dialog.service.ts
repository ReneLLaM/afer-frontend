import { Injectable, signal } from '@angular/core';

export type DialogType = 'info' | 'warning' | 'success' | 'error' | 'confirm';

export interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  showCancel?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly _isOpen = signal(false);
  private readonly _options = signal<DialogOptions | null>(null);
  private _resolve: ((value: boolean) => void) | null = null;

  readonly isOpen = this._isOpen.asReadonly();
  readonly options = this._options.asReadonly();

  /**
   * Muestra un diálogo de confirmación.
   * @returns Promesa que resuelve a true si el usuario confirma, false si cancela.
   */
  confirm(options: DialogOptions): Promise<boolean> {
    this._options.set({
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      type: 'confirm',
      showCancel: true,
      ...options
    });
    this._isOpen.set(true);

    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  /**
   * Muestra un diálogo de información (solo botón Aceptar).
   */
  info(title: string, message: string, confirmText = 'Aceptar'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText,
      showCancel: false,
      type: 'info'
    });
  }

  /**
   * Cierra el diálogo y resuelve la promesa.
   */
  close(result: boolean): void {
    this._isOpen.set(false);
    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
  }
}

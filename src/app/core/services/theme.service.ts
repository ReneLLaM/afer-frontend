import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);

  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      
      // Añadir clase para desactivar transiciones temporalmente
      this.document.body.classList.add('no-transition');
      
      this.document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('user-theme', theme);
      
      // Eliminar la clase después de un pequeño delay
      setTimeout(() => {
        this.document.body.classList.remove('no-transition');
      }, 0);
    });
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
  }

  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem('user-theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CategoriesResponse } from '../pages/categories-page/interfaces/categories-response.interface';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${baseUrl}/categories/tree`;

  // --- CACHÉ INTELIGENTE ---
  // Guardamos los datos y la hora en que se guardaron
  private cache: { data: CategoriesResponse; timestamp: number } | null = null;

  getTree(): Observable<CategoriesResponse> {
    const ahora = Date.now();
    const CINCO_MINUTOS = 5 * 60 * 1000;

    // 1. Buscamos en el caché
    if (this.cache && ahora - this.cache.timestamp < CINCO_MINUTOS) {
      console.log('📦 Categories: Cargando desde CACHÉ (Vigente)');
      return of(this.cache.data);
    }

    // 2. Si no existe o ya caducó, pedimos al servidor
    console.log('🌐 Categories: Pidiendo al SERVIDOR (Caché vacío o caducado)');

    return this.http.get<CategoriesResponse>(this.apiUrl).pipe(
      tap((response) => {
        console.log('✅ Categories: Guardado en caché (Vence en 5 min)');
        this.cache = { data: response, timestamp: ahora };
      }),
    );
  }

  /** Invalida el caché manualmente (útil tras operaciones CRUD en admin) */
  clearCache(): void {
    this.cache = null;
  }
}
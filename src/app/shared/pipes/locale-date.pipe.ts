import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'localeDate', standalone: true })
export class LocaleDatePipe implements PipeTransform {
  transform(value: unknown, style: 'short' | 'medium' | 'long' = 'short'): string {
    if (value == null || value === '') return '';
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);

    const options: Intl.DateTimeFormatOptions =
      style === 'long'
        ? { dateStyle: 'long', timeStyle: 'short' }
        : style === 'medium'
          ? { dateStyle: 'medium' }
          : { dateStyle: 'short' };

    return date.toLocaleString(undefined, options);
  }
}

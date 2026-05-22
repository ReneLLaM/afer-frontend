import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: unknown, max = 80, suffix = '…'): string {
    if (value == null) return '';
    const str = String(value);
    if (str.length <= max) return str;
    return str.slice(0, max).trimEnd() + suffix;
  }
}

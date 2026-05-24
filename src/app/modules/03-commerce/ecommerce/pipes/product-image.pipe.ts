import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'productImage',
})
export class ProductImagePipe implements PipeTransform {
  transform(value: string | string[] | undefined | null): string {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return `assets/images/placeholder.png`;
    }

    if (typeof value === 'string') {
      return value;
    }

    const image = value.at(0);

    if (image && image !== '') {
      return image;
    }

    return `assets/images/placeholder.png`;
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../../../environments/environment';

const imgUrl = environment.imgUrl;

@Pipe({
  name: 'productImage',
})
export class ProductImagePipe implements PipeTransform {
  transform(value: string | string[] | undefined | null): string {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return `assets/images/placeholder.png`;
    }

    if (typeof value === 'string') {
      return `${imgUrl}/${value}`;
    }

    const image = value.at(0);

    if (image && image !== '') {
      return `${image}`; //todo añadir url de claudinary
    }

    return `assets/images/placeholder.png`;
  }
}

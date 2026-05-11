import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'tiktokIframe',
  standalone: true
})
export class TiktokIframePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | undefined): SafeResourceUrl | null {
    if (!value) return null;
    
    // Buscar el data-video-id en el bloque HTML proporcionado
    const match = value.match(/data-video-id="(\d+)"/);
    if (match && match[1]) {
      const videoId = match[1];
      const url = `https://www.tiktok.com/embed/v2/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    
    // Por si la URL viene limpia o es un id directo
    if (/^\d+$/.test(value.trim())) {
      const url = `https://www.tiktok.com/embed/v2/${value.trim()}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    return null;
  }
}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'tiktokIframe',
  standalone: true,
})
export class TiktokIframePipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | undefined): SafeResourceUrl | null {
    if (!value) return null;

    const match = value.match(/data-video-id="(\d+)"/);
    if (match?.[1]) {
      const videoId = match[1];
      const url = `https://www.tiktok.com/embed/v2/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    if (/^\d+$/.test(value.trim())) {
      const url = `https://www.tiktok.com/embed/v2/${value.trim()}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    return null;
  }
}

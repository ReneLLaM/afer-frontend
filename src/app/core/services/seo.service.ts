import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  robots?: string;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  private readonly defaultData: SeoData = {
    title: 'Afer Bolivia - Artículos para Hogar, Oficina y Cocina con Envíos Gratis',
    description: 'Bienvenidos a Afer Bolivia, tu tienda online para el hogar, oficina y cocina. Ofrecemos productos de marcas líderes como SAMSUNG, SONY, LG, y más. Compra en línea con envío gratis en Bolivia.',
    keywords: 'Afer Bolivia, artículos para el hogar, artículos de oficina, artículos de cocina, SAMSUNG, SONY, LG, electrodomésticos Bolivia, envíos gratis Bolivia, compras en línea Bolivia, tienda online Bolivia, garantía nacional, ventas online, Afer Bolivia envíos, compras Bolivia',
    image: 'https://www.aferbolivia.com/images/open-graph-2.jpg',
    url: 'https://www.aferbolivia.com',
    type: 'website',
    author: 'Afer Bolivia',
    robots: 'index, follow'
  };

  updateSeoData(data: SeoData): void {
    const seoData = { ...this.defaultData, ...data };

    // Title
    if (seoData.title) {
      this.title.setTitle(seoData.title);
      this.meta.updateTag({ property: 'og:title', content: seoData.title });
      this.meta.updateTag({ name: 'twitter:title', content: seoData.title });
    }

    // Description
    if (seoData.description) {
      this.meta.updateTag({ name: 'description', content: seoData.description });
      this.meta.updateTag({ property: 'og:description', content: seoData.description });
      this.meta.updateTag({ name: 'twitter:description', content: seoData.description });
    }

    // Keywords
    if (seoData.keywords) {
      this.meta.updateTag({ name: 'keywords', content: seoData.keywords });
    }

    // Image
    if (seoData.image) {
      this.meta.updateTag({ property: 'og:image', content: seoData.image });
      this.meta.updateTag({ name: 'twitter:image', content: seoData.image });
    }

    // URL
    if (seoData.url) {
      this.meta.updateTag({ property: 'og:url', content: seoData.url });
    }

    // Type
    if (seoData.type) {
      this.meta.updateTag({ property: 'og:type', content: seoData.type });
    }

    // Author
    if (seoData.author) {
      this.meta.updateTag({ name: 'author', content: seoData.author });
    }

    // Robots
    if (seoData.robots) {
      this.meta.updateTag({ name: 'robots', content: seoData.robots });
    }

    // Canonical
    this.updateCanonicalUrl(seoData.canonical || seoData.url);
  }

  private updateCanonicalUrl(url?: string): void {
    if (!url) return;
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
      link.setAttribute('href', url);
    }
  }
}

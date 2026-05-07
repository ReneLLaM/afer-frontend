import { Component } from '@angular/core';
import { SOCIAL_LINKS, CONTACT_INFO } from '../../../core/constants/social-links.constants';

@Component({
  selector: 'footer-shop',
  imports: [],
  templateUrl: './footer-shop.html',
  styleUrl: './footer-shop.scss',
})
export class FooterShop {
  currentYear = new Date().getFullYear();
  socialLinks = SOCIAL_LINKS;
  contactInfo = CONTACT_INFO;
}

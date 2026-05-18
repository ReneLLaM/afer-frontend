import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SOCIAL_LINKS, CONTACT_INFO } from '../../../core/constants/social-links.constants';

@Component({
  selector: 'footer-shop',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer-shop.html',
  styleUrl: './footer-shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterShop {
  currentYear = new Date().getFullYear();
  socialLinks = SOCIAL_LINKS;
  contactInfo = CONTACT_INFO;
}

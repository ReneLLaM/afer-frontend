import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Slide } from '../slide.model';

@Component({
  selector: 'app-hero-slide-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-slide-item.html',
  styleUrl: './hero-slide-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSlideItem {
  slide = input.required<Slide>();
  isActive = input<boolean>(false);
}

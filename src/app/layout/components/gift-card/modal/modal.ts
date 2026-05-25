import {
  Component,
  signal,
  computed,
  output,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface GifCard {
  key: string;
  label: string;
  theme: string;
  image: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './modal.html',
  styleUrls: ['./modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GiftCardModal {
  private destroyRef = inject(DestroyRef);

  readonly cards: GifCard[] = [
    { key: 'orange', label: 'Naranja', theme: 'theme-orange', image: '/assets/gif-cart/naranja.png' },
    { key: 'green', label: 'Verde', theme: 'theme-green', image: '/assets/gif-cart/verde.png' },
    { key: 'blue', label: 'Azul', theme: 'theme-blue', image: '/assets/gif-cart/azul.png' },
    { key: 'red', label: 'Rojo', theme: 'theme-red', image: '/assets/gif-cart/rojo.png' },
  ];

  readonly selectedIndex = signal(0);
  readonly swapping = signal(false);
  readonly closing = signal(false);
  readonly paused = signal(false);

  readonly selected = computed(() => this.cards[this.selectedIndex()]);

  closed = output<void>();

  private timer: ReturnType<typeof setInterval> | null = null;
  private swapJob: ReturnType<typeof setTimeout> | null = null;
  private closeJob: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.startTimer();
    this.destroyRef.onDestroy(() => {
      this.stopTimer();
      this.cancelSwap();
      this.cancelClose();
    });
  }

  selectCard(index: number): void {
    if (index === this.selectedIndex()) return;
    this.paused.set(true);
    this.stopTimer();
    this.cancelSwap();
    this.doSwap(index);
  }

  closeModal(): void {
    if (this.closing()) return;
    this.closing.set(true);
    this.stopTimer();
    this.cancelSwap();

    this.cancelClose();
    this.closeJob = setTimeout(() => {
      this.closeJob = null;
      this.closed.emit();
    }, 180);
  }

  private doSwap(nextIndex: number): void {
    this.swapping.set(true);
    this.swapJob = setTimeout(() => {
      this.swapJob = null;
      this.selectedIndex.set(nextIndex);
      this.swapping.set(false);
    }, 200);
  }

  private startTimer(): void {
    if (this.paused()) return;
    this.timer = setInterval(() => {
      if (this.swapping()) return;
      const next = (this.selectedIndex() + 1) % this.cards.length;
      this.doSwap(next);
    }, 3000);
  }

  private stopTimer(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private cancelSwap(): void {
    if (this.swapJob) { clearTimeout(this.swapJob); this.swapJob = null; }
    this.swapping.set(false);
  }

  private cancelClose(): void {
    if (this.closeJob) { clearTimeout(this.closeJob); this.closeJob = null; }
  }
}

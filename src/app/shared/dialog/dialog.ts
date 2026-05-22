import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss'
})
export class DialogComponent {
  protected readonly dialogService = inject(DialogService);

  get iconType(): string {
    const type = this.dialogService.options()?.type || 'info';
    return type === 'confirm' ? 'info' : type;
  }

  onConfirm(): void {
    this.dialogService.close(true);
  }

  onCancel(): void {
    this.dialogService.close(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }
}

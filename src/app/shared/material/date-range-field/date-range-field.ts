import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { MatDateRangePicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface DateRangeValue {
  start: string;
  end: string;
}

@Component({
  selector: 'app-date-range-field',
  standalone: true,
  imports: [MatDatepickerModule, MatNativeDateModule],
  templateUrl: './date-range-field.html',
  styleUrl: './date-range-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeField {
  @ViewChild('rangePicker') private readonly rangePicker?: MatDateRangePicker<Date>;

  label = input<string>('Vigencia');
  hint = input<string>('Sin inicio: vigente desde ahora. Sin fin: sin vencimiento.');
  startPlaceholder = input<string>('Fecha de inicio');
  endPlaceholder = input<string>('Fecha de fin');
  startValue = input<string>('');
  endValue = input<string>('');

  rangeChange = output<DateRangeValue>();

  emitRange(start: string, end: string): void {
    this.rangeChange.emit({
      start,
      end,
    });
  }

  openRangePicker(): void {
    this.rangePicker?.open();
  }

  onPickerDateChange(boundary: 'start' | 'end', value: Date | null): void {
    const formatted = this.formatDate(value);
    this.rangeChange.emit({
      start: boundary === 'start' ? formatted : this.startValue(),
      end: boundary === 'end' ? formatted : this.endValue(),
    });
  }

  onRangePickerChange(start: Date | null, end: Date | null): void {
    this.rangeChange.emit({
      start: this.formatDate(start),
      end: this.formatDate(end),
    });
  }

  toDate(value: string): Date | null {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDate(value: Date | null): string {
    if (!value) return '';

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

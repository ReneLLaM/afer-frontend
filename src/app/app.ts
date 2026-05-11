import { Component, inject, signal } from '@angular/core';
import { MaterialModule } from './shared/material/material-module';
// import { ToastComponent } from "./shared/toast/toast";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MaterialModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // protected readonly title = signal('frontend');

  // private toastService = inject(ToastService);

  // showSuccess() {
  //   this.toastService.success('Proceso completado', 'Operación realizada exitosamente');
  // }

  // showError() {
  //   this.toastService.error('Error', 'Se produjo un error al procesar la solicitud');
  // }

  // showInfo() {
  //   this.toastService.info('Información', 'Se requiere atención adicional');
  // }

  // showWarning() {
  //   this.toastService.warning('Advertencia', 'Acción pendiente de autorización');
  // }
}

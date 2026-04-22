import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sanitation-report-view',
  standalone: true,
  imports: [CommonModule, ChartModule, ButtonModule],
  templateUrl: './sanitation-report-view.component.html'
})
export class SanitationReportView {

  @Input() visible = false;
  @Input() header: any;
  @Input() steps: any[] = [];
  @Input() chartTemperatura: any;
  @Input() chartConcentracion: any;
  @Input() chartFlujo: any;
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('reportePDF') reportePDF!: ElementRef;

  cerrar() {
    this.onClose.emit();
  }

  exportarPDF() {

    const element = this.reportePDF.nativeElement;

    html2canvas(element).then(canvas => {

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('l', 'mm', 'a4');

      pdf.addImage(imgData, 'PNG', 10, 10, 280, 180);

      pdf.save('reporte-saneamiento.pdf');

    });
  }

    getPasosNormalizados() {
      if (!this.steps || this.steps.length === 0) return [];

      const total = this.steps.reduce((sum, p) => sum + p.duracionSegundos, 0);

      return this.steps.map(p => ({
        ...p,
        proporcion: total ? p.duracionSegundos / total : 1
      }));
    }
}
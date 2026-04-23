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
  templateUrl: './sanitation-report-view.component.html',
  styleUrl: './sanitation-report-view.component.scss'
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

    html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - 20;
        }
      }

      pdf.save('reporte-saneamiento.pdf');
    });
  }

  getPasosNormalizados() {
    if (!this.steps || this.steps.length === 0) return [];

    const total = this.steps.reduce((sum, p) => sum + (p.duracionSegundos || 0), 0);

    return this.steps.map(p => ({
      ...p,
      proporcion: total ? (p.duracionSegundos || 0) / total : 1
    }));
  }

  formatearDuracion(segundos: number): string {
    if (segundos === null || segundos === undefined) return '';

    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;

    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}
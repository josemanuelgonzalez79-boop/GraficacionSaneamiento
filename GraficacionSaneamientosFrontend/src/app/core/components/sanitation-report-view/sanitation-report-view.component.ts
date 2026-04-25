import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sanitation-report-view',
  standalone: true,
  imports: [CommonModule, ChartModule, ButtonModule],
  templateUrl: './sanitation-report-view.component.html',
  styleUrls: ['./sanitation-report-view.component.scss']
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

  exportandoPDF = false;

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
          callback: function (value: any) {
            return value.toFixed(0);
          }
        },
        grid: {
          color: '#e5e7eb'
        }
      }
    }
  };

  cerrar() {
    this.onClose.emit();
  }

  async exportarPDF() {
    try {
      this.exportandoPDF = true;

      await new Promise(resolve => setTimeout(resolve, 100));

      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('l', 'mm', 'a4');
      const reportElement = this.reportePDF.nativeElement;

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - 20) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } else {
        const pageCanvasHeight = Math.floor((canvas.width * (pageHeight - 20)) / imgWidth);
        let remainingHeight = canvas.height;
        let pageOffset = 0;
        let firstPage = true;

        while (remainingHeight > 0) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pageCanvasHeight, remainingHeight);

          const pageCtx = pageCanvas.getContext('2d');

          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0,
              pageOffset,
              canvas.width,
              pageCanvas.height,
              0,
              0,
              canvas.width,
              pageCanvas.height
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/png');

          if (!firstPage) {
            pdf.addPage();
          }

          const pageImgHeight = (pageCanvas.height * imgWidth) / canvas.width;
          pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageImgHeight);

          firstPage = false;
          pageOffset += pageCanvasHeight;
          remainingHeight -= pageCanvasHeight;
        }
      }

      const proceso = this.header?.id ?? 'sin-id';
      pdf.save(`reporte-proceso-${proceso}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    } finally {
      this.exportandoPDF = false;
    }
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

  formatearFecha(fecha: string): string {
    if (!fecha) return '';

    const d = new Date(fecha);

    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calcularDuracion(inicio: string, fin: string): string {
    if (!inicio || !fin) return '';

    const start = new Date(inicio).getTime();
    const end = new Date(fin).getTime();

    const diff = Math.floor((end - start) / 1000);

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
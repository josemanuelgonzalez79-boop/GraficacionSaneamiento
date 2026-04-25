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
    let reportElement: HTMLElement | null = null;
    let originalWidth = '';
    let originalMaxWidth = '';
    let originalMargin = '';

    try {
      this.exportandoPDF = true;

      await new Promise(resolve => setTimeout(resolve, 100));

      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('l', 'mm', 'a4');
      reportElement = this.reportePDF.nativeElement as HTMLElement;
      originalWidth = reportElement.style.width;
      originalMaxWidth = reportElement.style.maxWidth;
      originalMargin = reportElement.style.margin;

      reportElement.style.width = '1200px';
      reportElement.style.maxWidth = '1200px';
      reportElement.style.margin = '0 auto';

      // Esperar a que los gráficos terminen de renderizar
      await new Promise(resolve => setTimeout(resolve, 500));

      const chartElements = Array.from(reportElement.querySelectorAll('.chart-container')) as HTMLElement[];
      const parentRect = reportElement.getBoundingClientRect();
      const chartBlocks = chartElements.map(el => {
        const rect = el.getBoundingClientRect();
        const top = Math.max(0, rect.top - parentRect.top);
        return { start: Math.round(top), end: Math.round(top + rect.height) };
      });

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
        windowWidth: 1200,
        windowHeight: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      reportElement.style.width = originalWidth;
      reportElement.style.maxWidth = originalMaxWidth;
      reportElement.style.margin = originalMargin;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxPageHeight = pageHeight - 20;
      const scale = canvas.width / reportElement.scrollWidth;
      const scaledChartBlocks = chartBlocks.map(block => ({
        start: Math.floor(block.start * scale),
        end: Math.ceil(block.end * scale)
      }));

      if (imgHeight <= maxPageHeight) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } else {
        const pixelsPerPage = Math.floor((canvas.width * maxPageHeight) / imgWidth);
        let remainingHeight = canvas.height;
        let pageOffset = 0;
        let firstPage = true;

        while (remainingHeight > 0) {
          let pageCanvasHeight = Math.min(pixelsPerPage, remainingHeight);
          let sliceEnd = pageOffset + pageCanvasHeight;

          const blockingChart = scaledChartBlocks.find(chart => chart.start > pageOffset && chart.start < sliceEnd && chart.end > sliceEnd);
          if (blockingChart) {
            // Si el corte ocurre dentro de un gráfico, adelanta el final de página al inicio del gráfico.
            sliceEnd = blockingChart.start;
            pageCanvasHeight = Math.max(1, sliceEnd - pageOffset);
          }

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageCanvasHeight;

          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0,
              pageOffset,
              canvas.width,
              pageCanvasHeight,
              0,
              0,
              canvas.width,
              pageCanvasHeight
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/png');
          if (!firstPage) {
            pdf.addPage();
          }

          const pageImgHeight = (pageCanvasHeight * imgWidth) / canvas.width;
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
      if (reportElement) {
        reportElement.style.width = originalWidth;
        reportElement.style.maxWidth = originalMaxWidth;
        reportElement.style.margin = originalMargin;
      }
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
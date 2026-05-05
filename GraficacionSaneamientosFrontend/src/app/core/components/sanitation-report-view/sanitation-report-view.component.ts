import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit } from '@angular/core';
import { QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { UIChart } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-sanitation-report-view',
  standalone: true,
  imports: [CommonModule, ChartModule, ButtonModule, FormsModule],
  templateUrl: './sanitation-report-view.component.html',
  styleUrls: ['./sanitation-report-view.component.scss']
})
export class SanitationReportView implements OnInit{
  @Input() visible = false;
  @Input() header: any;
  @Input() steps: any[] = [];
  @Input() chartTemperatura: any;
  @Input() chartConcentracion: any;
  @Input() chartFlujo: any;
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('reportePDF') reportePDF!: ElementRef;
  @ViewChildren(UIChart) charts!: QueryList<UIChart>;

  exportandoPDF = false;

  etapaSeleccionada: any = null;

  puntosSeleccionados: number[] = [];

  modoGrafica: 'zoom' | 'seleccion' | null = null;

  chartPlugins = [
    {
      id: 'etapaSeleccionadaPlugin',
      beforeDatasetsDraw: (chart: any) => {

        const { ctx, chartArea, scales } = chart;

        if (!chartArea) return;

        ctx.save();

        // RANGO DE ETAPA SELECCIONADA
        if (this.etapaSeleccionada && this.steps?.length) {

          const totalSegundos = this.steps.reduce(
            (acc, p) => acc + (p.duracionSegundos || 0),
            0
          );

          if (totalSegundos > 0) {

            let inicioSegundos = 0;

            for (const paso of this.steps) {
              if (paso.step == this.etapaSeleccionada.step) break;
              inicioSegundos += paso.duracionSegundos || 0;
            }

            const finSegundos =
              inicioSegundos + (this.etapaSeleccionada.duracionSegundos || 0);

            const ancho = chartArea.right - chartArea.left;

            const xInicio =
              chartArea.left + (inicioSegundos / totalSegundos) * ancho;

            const xFin =
              chartArea.left + (finSegundos / totalSegundos) * ancho;

            ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
            ctx.fillRect(
              xInicio,
              chartArea.top,
              xFin - xInicio,
              chartArea.bottom - chartArea.top
            );

            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(xInicio, chartArea.top);
            ctx.lineTo(xInicio, chartArea.bottom);
            ctx.moveTo(xFin, chartArea.top);
            ctx.lineTo(xFin, chartArea.bottom);
            ctx.stroke();
          }
        }

        // LÍNEAS DE PUNTOS SELECCIONADOS
        if (this.puntosSeleccionados?.length && scales?.x) {

          this.puntosSeleccionados.forEach(index => {

            const x = scales.x.getPixelForValue(index);

            ctx.beginPath();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1.5;

            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();

            ctx.setLineDash([]);
          });
        }

        ctx.restore();
      }
    }
  ];

  ngOnInit(): void {
    this.modoGrafica = null;
  }

  seleccionarEtapa(paso: any): void {
    if (this.etapaSeleccionada?.step == paso.step) {
      this.etapaSeleccionada = null;
    } else {
      this.etapaSeleccionada = paso;
    }

    setTimeout(() => {
      this.charts?.forEach(chart => {
        chart.chart?.update();
      });
    });
  }

  seleccionarPuntoGrafica(event: any, chart: any): void {
    if (this.modoGrafica !== 'seleccion') return;

    const puntos = chart.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: false, axis: 'x' },
      false
    );

    if (!puntos.length) return;

    const index = puntos[0].index;

    if (this.puntosSeleccionados.includes(index)) {
      this.puntosSeleccionados = this.puntosSeleccionados.filter(i => i !== index);
    } else {
      this.puntosSeleccionados.push(index);
    }
    this.actualizarGraficas();
  }

  resetInteraccion(): void {
    this.modoGrafica = null;
    this.etapaSeleccionada = null;
    this.puntosSeleccionados = [];
    this.actualizarGraficas();
  }

  actualizarGraficas(): void {
    setTimeout(() => {
      this.charts?.forEach(chart => {
        chart.chart?.update();
      });
    });
  }

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    onClick: (event: any, elements: any[], chart: any) => {
      this.seleccionarPuntoGrafica(event, chart);
    },

    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
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
import {
  Component, Input, Output, EventEmitter, ViewChild, ViewChildren,
  ElementRef, OnInit, OnChanges, OnDestroy, SimpleChanges, QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule, UIChart } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Se conserva el plugin original utilizado por los indicadores de agua.
const centerTextPlugin = {
  id: 'centerTextPlugin',
  afterDraw: (chart: any) => {
    if (chart.config.type !== 'doughnut') return;
    const centerText = chart?.options?.plugins?.centerText;
    if (!centerText?.display) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;
    const x = meta.data[0].x;
    const y = meta.data[0].y;
    const ctx = chart.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(centerText.line1 || '', x, y - 12);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(centerText.line2 || '', x, y + 12);
    ctx.restore();
  }
};
Chart.register(zoomPlugin, ChartDataLabels, centerTextPlugin as any);

/** Las series usan las mismas muestras de cleaning_data, ordenadas por update_time. */
interface SerieGeneral {
  key: string;
  label: string;
  color: string;
  eje: 'yTemp' | 'yQuimica' | 'yFlow' | 'yLevel';
  grupo: 'temperatura' | 'quimica' | 'flujo' | 'niveles';
  discontinua?: boolean;
}

@Component({
  selector: 'app-sanitation-report-view',
  standalone: true,
  imports: [CommonModule, ChartModule, ButtonModule, FormsModule],
  templateUrl: './sanitation-report-view.component.html',
  styleUrls: ['./sanitation-report-view.component.scss']
})
export class SanitationReportView implements OnInit, OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() header: any;
  @Input() steps: any[] = [];
  @Input() waters: any = null;
  @Input() rawData: any[] = [];
  @Input() chartTemperatura: any;
  @Input() chartConcentracion: any;
  @Input() chartFlujo: any;
  @Input() tituloGraficaQuimica: string = 'Concentración';
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('reportePDF') reportePDF!: ElementRef;
  @ViewChildren(UIChart) charts!: QueryList<UIChart>;

  private combinedCanvasElement: HTMLCanvasElement | null = null;
  private combinedChartInstance: Chart | null = null;

  // Angular crea/destruye esta vista con @if (visible). El setter asegura
  // que la gráfica exista sólo cuando el canvas está montado en el DOM.
  @ViewChild('combinedCanvas')
  set combinedCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (!ref) {
      this.combinedChartInstance?.destroy();
      this.combinedChartInstance = null;
      this.combinedCanvasElement = null;
      return;
    }
    this.combinedCanvasElement = ref.nativeElement;
    setTimeout(() => this.renderCombinedChart(), 0);
  }

  exportandoPDF = false;
  etapaSeleccionada: any = null;
  puntosSeleccionados: number[] = [];
  modoGrafica: 'zoom' | 'seleccion' | null = null;

  // Las tres gráficas anteriores permanecen intactas. Esta es adicional.
  chartGeneral: any = { labels: [], datasets: [] };
  chartGeneralOptions: any = {};
  selectedCombinedSeries: Record<string, boolean> = {
    spTemp: true,
    returnTemp: true,
    supplyTemp: true,
    spCond: true,
    returnCond: true,
    spOzone: true,
    returnOzone: true,
    spFlow: true,
    supplyFlow: true,
    levelTa5001: false,
    levelTa5002: false,
    levelTa5003: false,
    levelTa5004: false
  };

  // Estado original de indicadores de agua (sin modificar las tablas del reporte).
  chartRecolectada: any = { labels: [], datasets: [{ data: [], backgroundColor: ['#10b981', '#ef4444'] }] };
  chartConsumida: any = { labels: [], datasets: [{ data: [], backgroundColor: ['#2563eb', '#f59e0b'] }] };
  chartRecolectadaOptions: any = {};
  chartConsumidaOptions: any = {};
  summaryRecolectada = {
    total: 0, recuperadaRecolectada: 0, noRecolectada: 0,
    porcentajeRecolectada: '0.00', porcentajeNoRecolectada: '0.00'
  };
  summaryConsumida = {
    total: 0, aguaTratadaConsumida: 0, recuperadaConsumida: 0,
    porcentajeAguaTratadaConsumida: '0.00', porcentajeRecuperadaConsumida: '0.00'
  };

  chartPlugins: any[] = [{
    id: 'etapaSeleccionadaPlugin',
    beforeDatasetsDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      ctx.save();
      if (this.etapaSeleccionada && this.steps?.length) {
        const totalSegundos = this.steps.reduce((a, p) => a + (p.duracionSegundos || 0), 0);
        if (totalSegundos > 0) {
          let inicioSegundos = 0;
          for (const paso of this.steps) {
            if (paso.step == this.etapaSeleccionada.step) break;
            inicioSegundos += paso.duracionSegundos || 0;
          }
          const finSegundos = inicioSegundos + (this.etapaSeleccionada.duracionSegundos || 0);
          const ancho = chartArea.right - chartArea.left;
          const xInicio = chartArea.left + (inicioSegundos / totalSegundos) * ancho;
          const xFin = chartArea.left + (finSegundos / totalSegundos) * ancho;
          ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
          ctx.fillRect(xInicio, chartArea.top, xFin - xInicio, chartArea.bottom - chartArea.top);
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
  }];

  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[], chart: any) => this.seleccionarPuntoGrafica(event, chart),
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
      datalabels: { display: false },
      zoom: {
        pan: { enabled: false, mode: 'x' },
        zoom: { wheel: { enabled: false }, pinch: { enabled: false }, mode: 'x' }
      }
    },
    scales: {
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10, callback: (value: number) => value.toFixed(0) },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  ngOnInit(): void {
    this.modoGrafica = null;
    this.generarGraficaAgua();
    this.buildCombinedChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['header']) this.generarGraficaAgua();
    if (changes['rawData'] || changes['tituloGraficaQuimica']) this.buildCombinedChart();
  }

  // ==================================================================
  // GRÁFICA GENERAL: temperatura, química, flujo y niveles de tanque.
  // ==================================================================
  private esGraficaOzono(): boolean {
    return (this.tituloGraficaQuimica || '').toLowerCase().includes('ozono');
  }

  getSeriesGeneralesDisponibles(): SerieGeneral[] {
    const temperatura: SerieGeneral[] = [
      { key: 'spTemp', label: 'Meta de temperatura [°C]', color: '#111827', eje: 'yTemp', grupo: 'temperatura', discontinua: true },
      { key: 'returnTemp', label: 'Retorno de temperatura [°C]', color: '#16a34a', eje: 'yTemp', grupo: 'temperatura' },
      { key: 'supplyTemp', label: 'Suministro de temperatura [°C]', color: '#ef4444', eje: 'yTemp', grupo: 'temperatura' }
    ];
    const quimica: SerieGeneral[] = this.esGraficaOzono()
      ? [
          { key: 'spOzone', label: 'Meta de ozono', color: '#6b7280', eje: 'yQuimica', grupo: 'quimica', discontinua: true },
          { key: 'returnOzone', label: 'Retorno de ozono', color: '#eab308', eje: 'yQuimica', grupo: 'quimica' }
        ]
      : [
          { key: 'spCond', label: 'Meta de concentración / conductividad', color: '#6b7280', eje: 'yQuimica', grupo: 'quimica', discontinua: true },
          { key: 'returnCond', label: 'Retorno de concentración / conductividad', color: '#0284c7', eje: 'yQuimica', grupo: 'quimica' }
        ];
    const flujo: SerieGeneral[] = [
      { key: 'spFlow', label: 'Meta de flujo', color: '#7c3aed', eje: 'yFlow', grupo: 'flujo', discontinua: true },
      { key: 'supplyFlow', label: 'Suministro de flujo', color: '#0d9488', eje: 'yFlow', grupo: 'flujo' }
    ];
    const niveles: SerieGeneral[] = [
      { key: 'levelTa5001', label: 'LE-5001 - Nivel de Tanque de Agua Tratada TA-5001 [Lts]', color: '#8b5cf6', eje: 'yLevel', grupo: 'niveles' },
      { key: 'levelTa5002', label: 'LE-5002 - Nivel de Tanque de Detergente TA-5002 [Lts]', color: '#f59e0b', eje: 'yLevel', grupo: 'niveles' },
      { key: 'levelTa5003', label: 'LE-5003 - Nivel de Tanque de Sanitizante TA-5003 [Lts]', color: '#ec4899', eje: 'yLevel', grupo: 'niveles' },
      { key: 'levelTa5004', label: 'LE-5004 - Nivel de Tanque de Agua Recuperada TA-5004 [Lts]', color: '#0ea5e9', eje: 'yLevel', grupo: 'niveles' }
    ];
    return [...temperatura, ...quimica, ...flujo, ...niveles];
  }

  // Leyenda para el PDF: reutiliza colores, tipos de línea y selección real
  // de la gráfica combinada. Los nombres de niveles se acortan para que la
  // leyenda resulte legible en una hoja A4 horizontal.
  get gruposLeyendaGeneralPDF(): Array<{
    key: SerieGeneral['grupo'];
    titulo: string;
    series: Array<SerieGeneral & { etiquetaPDF: string }>;
  }> {
    const grupos: Array<{ key: SerieGeneral['grupo']; titulo: string }> = [
      { key: 'temperatura', titulo: 'TEMPERATURA [°C]' },
      { key: 'quimica', titulo: this.esGraficaOzono() ? 'OZONO' : 'CONDUCTIVIDAD' },
      { key: 'flujo', titulo: 'FLUJO' },
      { key: 'niveles', titulo: 'NIVELES DE TANQUE [L]' }
    ];
    const etiquetas: Record<string, string> = {
      spTemp: 'Meta',
      returnTemp: 'Retorno',
      supplyTemp: 'Suministro',
      spCond: 'Meta',
      returnCond: 'Retorno',
      spOzone: 'Meta',
      returnOzone: 'Retorno',
      spFlow: 'Meta',
      supplyFlow: 'Suministro',
      levelTa5001: 'LE-5001 · Agua tratada',
      levelTa5002: 'LE-5002 · Detergente',
      levelTa5003: 'LE-5003 · Sanitizante',
      levelTa5004: 'LE-5004 · Agua recuperada'
    };
    const visibles = this.getSeriesGeneralesDisponibles()
      .filter(serie => !!this.selectedCombinedSeries[serie.key]);

    return grupos.map(grupo => ({
      ...grupo,
      series: visibles
        .filter(serie => serie.grupo === grupo.key)
        .map(serie => ({
          ...serie,
          etiquetaPDF: etiquetas[serie.key] ?? serie.label
        }))
    })).filter(grupo => grupo.series.length > 0);
  }

  get numeroSeriesGeneralesSeleccionadas(): number {
    return this.getSeriesGeneralesDisponibles()
      .filter(s => !!this.selectedCombinedSeries[s.key]).length;
  }

  toggleSerieGeneral(key: string): void {
    this.selectedCombinedSeries[key] = !this.selectedCombinedSeries[key];
    this.buildCombinedChart();
  }

  seleccionarTodasLasSeriesGenerales(): void {
    this.getSeriesGeneralesDisponibles().forEach(s => this.selectedCombinedSeries[s.key] = true);
    this.buildCombinedChart();
  }

  limpiarSeriesGenerales(): void {
    this.getSeriesGeneralesDisponibles().forEach(s => this.selectedCombinedSeries[s.key] = false);
    this.buildCombinedChart();
  }

  private buildCombinedChartOptions(): any {
    const seleccionadas = this.getSeriesGeneralesDisponibles()
      .filter(s => this.selectedCombinedSeries[s.key]);
    const usa = (eje: SerieGeneral['eje']) => seleccionadas.some(s => s.eje === eje);
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      onClick: (event: any, elements: any[], chart: any) => this.seleccionarPuntoGrafica(event, chart),
      plugins: {
        legend: { display: false }, // Los checkbox son la leyenda interactiva.
        tooltip: { mode: 'index', intersect: false },
        datalabels: { display: false },
        zoom: this.chartOptions.plugins.zoom
      },
      layout: {
        padding: { top: 6, right: 10, bottom: 22, left: 10 }
      },
      scales: {
        x: {
          display: true,
          offset: false,
          title: { display: true, text: 'Hora del proceso', color: '#475569' },
          ticks: {
            display: true,
            autoSkip: true,
            maxTicksLimit: 12,
            maxRotation: 0,
            minRotation: 0,
            padding: 8,
            color: '#475569',
            font: { size: 11 }
          },
          grid: { color: '#e2e8f0' }
        },
        yTemp: {
          type: 'linear', position: 'left', display: usa('yTemp'),
          title: { display: usa('yTemp'), text: 'Temperatura [°C]' },
          grid: { color: '#f1f5f9' }
        },
        yQuimica: {
          type: 'linear', position: 'right', display: usa('yQuimica'),
          title: { display: usa('yQuimica'), text: this.esGraficaOzono() ? 'Ozono' : 'Concentración / Conductividad' },
          grid: { drawOnChartArea: false }
        },
        yFlow: {
          type: 'linear', position: 'right', offset: true, display: usa('yFlow'),
          title: { display: usa('yFlow'), text: 'Flujo' },
          grid: { drawOnChartArea: false }
        },
        yLevel: {
          type: 'linear', position: 'left', offset: true, display: usa('yLevel'),
          title: { display: usa('yLevel'), text: 'Nivel [Lts]' },
          grid: { drawOnChartArea: false }
        }
      }
    };
  }

  buildCombinedChart(): void {
    const raw = Array.isArray(this.rawData) ? this.rawData : [];
    const defs = this.getSeriesGeneralesDisponibles();
    const activos = defs.filter(s => this.selectedCombinedSeries[s.key]);
    const labels = raw.map((d: any) => {
      const fecha = new Date(d.tiempo);
      return isNaN(fecha.getTime()) ? String(d.tiempo || '') : fecha.toLocaleTimeString('es-MX');
    });

    const datasets = activos.map(s => ({
      label: s.label,
      data: raw.map((d: any) => {
        const v = d?.[s.key];
        return v === null || v === undefined || v === '' ? null : Number(v);
      }),
      yAxisID: s.eje,
      borderColor: s.color,
      backgroundColor: s.color,
      borderWidth: 1.7,
      pointRadius: 0,
      pointHoverRadius: 3,
      stepped: !!s.discontinua,
      borderDash: s.discontinua ? [5, 4] : [],
      tension: 0,
      fill: false,
      spanGaps: false
    }));
    this.chartGeneral = { labels, datasets };
    this.chartGeneralOptions = this.buildCombinedChartOptions();
    this.actualizarGraficas();
  }

  private renderCombinedChart(): void {
    const canvas = this.combinedCanvasElement;
    if (!canvas || !canvas.isConnected) return;

    if (this.combinedChartInstance) {
      // Reutilizamos el mismo canvas: checkbox, etapa y modo de zoom no
      // vuelven a construir el componente ni crean instancias duplicadas.
      this.combinedChartInstance.data = this.chartGeneral;
      this.combinedChartInstance.options = this.chartGeneralOptions;
      this.combinedChartInstance.update('none');
      return;
    }

    this.combinedChartInstance = new Chart(canvas, {
      type: 'line',
      data: this.chartGeneral,
      options: this.chartGeneralOptions,
      plugins: this.chartPlugins as any
    });
  }

  ngOnDestroy(): void {
    this.combinedChartInstance?.destroy();
    this.combinedChartInstance = null;
    this.combinedCanvasElement = null;
  }

  // ==================================================================
  // COMPORTAMIENTO ACTUAL: ETAPAS, ZOOM, SELECCIÓN Y RESET.
  // ==================================================================
  private esGraficaPastel(chart: any): boolean {
    const type = chart?.config?.type || chart?.options?.type || chart?.type;
    return type === 'pie' || type === 'doughnut';
  }

  seleccionarEtapa(paso: any): void {
    this.etapaSeleccionada = this.etapaSeleccionada?.step == paso.step ? null : paso;
    this.actualizarGraficas();
  }

  seleccionarPuntoGrafica(event: any, chart: any): void {
    if (this.modoGrafica !== 'seleccion') return;
    const puntos = chart.getElementsAtEventForMode(
      event, 'nearest', { intersect: false, axis: 'x' }, false
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
    setTimeout(() => {
      this.charts?.forEach(chartRef => {
        const chart = chartRef.chart as any;
        if (!chart || this.esGraficaPastel(chart)) return;
        chart.resetZoom?.('none');
        if (chart.options?.scales?.x) {
          delete chart.options.scales.x.min;
          delete chart.options.scales.x.max;
        }
        chart.update('none');
      });
      const combinada = this.combinedChartInstance as any;
      combinada?.resetZoom?.('none');
      if (combinada?.options?.scales?.x) {
        delete combinada.options.scales.x.min;
        delete combinada.options.scales.x.max;
      }
      this.chartOptions = {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          zoom: {
            pan: { enabled: false, mode: 'x' },
            zoom: { wheel: { enabled: false }, pinch: { enabled: false }, mode: 'x' }
          }
        }
      };
      this.chartGeneralOptions = this.buildCombinedChartOptions();
      this.actualizarGraficas();
    });
  }

  cambiarModo(modo: 'zoom' | 'seleccion'): void {
    this.modoGrafica = modo;
    const zoomActivo = modo === 'zoom';
    this.chartOptions = {
      ...this.chartOptions,
      plugins: {
        ...this.chartOptions.plugins,
        zoom: {
          pan: { enabled: zoomActivo, mode: 'x' },
          zoom: { wheel: { enabled: zoomActivo }, pinch: { enabled: zoomActivo }, mode: 'x' }
        }
      }
    };
    this.chartGeneralOptions = this.buildCombinedChartOptions();
    this.actualizarGraficas();
  }

  actualizarGraficas(): void {
    setTimeout(() => {
      this.charts?.forEach(chartRef => {
        const chart = chartRef.chart as any;
        if (!chart || this.esGraficaPastel(chart)) return;
        chart.update();
      });
      this.renderCombinedChart();
    });
  }

  cerrar(): void {
    this.onClose.emit();
  }

  // ==================================================================
  // PDF: misma lógica y división de páginas de development.
  // ==================================================================
  async exportarPDF() {
    let reportElement: HTMLElement | null = null;
    let originalWidth = '';
    let originalMaxWidth = '';
    let originalMargin = '';
    try {
      this.exportandoPDF = true;
      await new Promise(resolve => setTimeout(resolve, 100));
      this.combinedChartInstance?.resize();
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
      this.combinedChartInstance?.resize();
      await new Promise(resolve => setTimeout(resolve, 60));
      const chartElements = Array.from(
        reportElement.querySelectorAll('.chart-container, .bloque-agua-layout')
      ) as HTMLElement[];
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
          const blockingChart = scaledChartBlocks.find(chart =>
            chart.start > pageOffset && chart.start < sliceEnd && chart.end > sliceEnd
          );
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
              canvas, 0, pageOffset, canvas.width, pageCanvasHeight,
              0, 0, canvas.width, pageCanvasHeight
            );
          }
          const pageImgData = pageCanvas.toDataURL('image/png');
          if (!firstPage) pdf.addPage();
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
      setTimeout(() => this.combinedChartInstance?.resize(), 0);
    }
  }

  // ==================================================================
  // HELPERS ORIGINALES DEL REPORTE.
  // ==================================================================
  getPasosNormalizados() {
    if (!this.steps?.length) return [];
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

  getWaterRecoveryRows() {
    if (!this.waters) return [];
    const stepsMap = (this.steps || []).reduce((map: any, paso: any) => {
      const key = String(paso?.step ?? '');
      if (key) map[key] = paso?.descripcion ?? paso?.description ?? '';
      return map;
    }, {} as Record<string, string>);
    const padIndex = (index: number) => String(index).padStart(2, '0');
    const getValue = (key: string) => Number(this.waters[key] || 0);
    const rows: any[] = [];
    const treatedFirst = getValue('treatedWater01');
    const recoveredFirst = getValue('recoveredWater01');
    const sentFirst = getValue('recoveredWaterSent');
    if (treatedFirst > 0 || recoveredFirst > 0 || sentFirst > 0) {
      rows.push({
        step: 1, descripcion: stepsMap['1'] ?? 'Etapa 1',
        aguaTratadaConsumida: treatedFirst || '',
        aguaRecuperadaConsumida: recoveredFirst || '',
        aguaRecuperadaRecolectada: sentFirst || ''
      });
    }
    for (let index = 2; index <= 16; index++) {
      const treated = getValue(`treatedWater${padIndex(index)}`);
      const recovered = getValue(`recoveredWater${padIndex(index)}`);
      if (treated > 0 || recovered > 0) {
        rows.push({
          step: index, descripcion: stepsMap[String(index)] ?? `Etapa ${index}`,
          aguaTratadaConsumida: treated || '',
          aguaRecuperadaConsumida: recovered || '',
          aguaRecuperadaRecolectada: ''
        });
      }
    }
    return rows;
  }

  private getWaterTotals() {
    if (!this.waters) return { treated: 0, recoveredReceived: 0, recoveredSent: 0 };
    const padIndex = (index: number) => String(index).padStart(2, '0');
    const getValue = (key: string) => Number(this.waters[key] || 0);
    const treated = Array.from({ length: 16 }, (_, i) => getValue(`treatedWater${padIndex(i + 1)}`))
      .reduce((sum, value) => sum + value, 0);
    const recoveredReceived = Array.from({ length: 16 }, (_, i) => getValue(`recoveredWater${padIndex(i + 1)}`))
      .reduce((sum, value) => sum + value, 0);
    return { treated, recoveredReceived, recoveredSent: getValue('recoveredWaterSent') };
  }

  private buildDoughnutOptions(total: number): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      events: ['mousemove', 'mouseout', 'touchmove', 'touchend'],
      onClick: () => {},
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = Number(context.raw || 0);
              const porcentaje = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
              return `${label}: ${value} - ${porcentaje}%`;
            }
          }
        },
        datalabels: {
          display: true,
          color: '#ffffff',
          font: { weight: 'bold', size: 13 },
          formatter: (value: any) => {
            const porcentaje = total > 0 ? ((Number(value) / total) * 100).toFixed(2) : '0.00';
            return `${porcentaje}%`;
          }
        },
        centerText: { display: true, line1: 'TOTAL:', line2: `${total}` }
      }
    };
  }

  private generarGraficaAgua(): void {
    const aguaTratadaConsumida = Number(this.header?.waterAccum || 0);
    const aguaRecuperadaRecolectada = Number(this.header?.returnWater || 0);
    const aguaRecuperadaConsumida = Number(this.header?.recoveredWaterSent || 0);
    const aguaNoRecolectada = Math.max(aguaTratadaConsumida - aguaRecuperadaRecolectada, 0);
    const pct = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(2) : '0.00';
    this.summaryRecolectada = {
      total: aguaTratadaConsumida,
      recuperadaRecolectada: aguaRecuperadaRecolectada,
      noRecolectada: aguaNoRecolectada,
      porcentajeRecolectada: pct(aguaRecuperadaRecolectada, aguaTratadaConsumida),
      porcentajeNoRecolectada: pct(aguaNoRecolectada, aguaTratadaConsumida)
    };
    this.chartRecolectada = {
      labels: ['Agua Recuperada Recolectada', 'Agua No Recolectada / Drenaje'],
      datasets: [{
        data: [aguaRecuperadaRecolectada, aguaNoRecolectada],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626']
      }]
    };
    this.chartRecolectadaOptions = this.buildDoughnutOptions(aguaTratadaConsumida);
    const totalAguaConsumida = aguaTratadaConsumida + aguaRecuperadaConsumida;
    this.summaryConsumida = {
      total: totalAguaConsumida,
      aguaTratadaConsumida,
      recuperadaConsumida: aguaRecuperadaConsumida,
      porcentajeAguaTratadaConsumida: pct(aguaTratadaConsumida, totalAguaConsumida),
      porcentajeRecuperadaConsumida: pct(aguaRecuperadaConsumida, totalAguaConsumida)
    };
    this.chartConsumida = {
      labels: ['Agua Tratada Consumida', 'Agua Recuperada Consumida'],
      datasets: [{
        data: [aguaTratadaConsumida, aguaRecuperadaConsumida],
        backgroundColor: ['#2563eb', '#8b5cf6'],
        hoverBackgroundColor: ['#1d4ed8', '#7c3aed']
      }]
    };
    this.chartConsumidaOptions = this.buildDoughnutOptions(totalAguaConsumida);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { GraficasService } from '../core/graficas.services';
import { ChartModule } from 'primeng/chart';
import { SanitationReportView } from '../core/components/sanitation-report-view/sanitation-report-view.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-genera-graficas-saneamientos',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    SanitationReportView
  ],
  providers: [GraficasService],
  templateUrl: './GeneraGraficaSaneamientos.html',
  styleUrls: ['./GeneraGraficaSaneamientos.scss']
})
export class GeneraGraficaSaneamientos implements OnInit {
  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();

  estaciones = [
    { label: 'Todas', value: null },
    { label: '1', value: 1 },
    { label: '2', value: 2 }
  ];

  objetos = [
    { label: 'Todas', value: null }
  ];

  recetas = [
    { label: 'Todas', value: null }
  ];

  estacionSeleccionada: number | null = null;
  objetoSeleccionado: string | null = null;
  recetaSeleccionada: string | null = null;
  mostrarReporte = false;

  registroSeleccionado: any = null;
  reporte: any = null;
  steps: any[] = [];
  rawData: any[] = [];

  temperaturaData: any[] = [];
  concentracionData: any[] = [];
  flujoData: any[] = [];
  chartTemperatura: any;
  chartConcentracion: any;
  chartFlujo: any;
  registros: any[] = [];

  constructor(@Inject(GraficasService) private graficasService: GraficasService) {}

  ngOnInit(): void {
    this.cargarObjetos();
    this.cargarRecetas();
  }

  cargarObjetos(): void {
    this.graficasService.GetObjects().subscribe({
      next: (resp) => {
        console.log('Objetos completos:', resp);

        const lista =
          Array.isArray(resp.data) ? resp.data :
          Array.isArray(resp.data?.data) ? resp.data.data :
          Array.isArray(resp.data?.objects) ? resp.data.objects :
          [];

        this.objetos = [
          { label: 'Todas', value: null },
          ...lista.map((item: any) => ({
            label: item.objectName ?? item.nombre ?? item.name ?? String(item),
            value: item.objectName ?? item.nombre ?? item.name ?? String(item)
          }))
        ];
      },
      error: (err) => {
        console.error('Error al cargar objetos', err);
      }
    });
  }

  cargarRecetas(): void {
    this.graficasService.GetRecipes().subscribe({
      next: (resp) => {
        console.log('Recetas completas:', resp);

        const lista =
          Array.isArray(resp.data) ? resp.data :
          Array.isArray(resp.data?.data) ? resp.data.data :
          Array.isArray(resp.data?.recipes) ? resp.data.recipes :
          [];

        this.recetas = [
          { label: 'Todas', value: null },
          ...lista.map((item: any) => ({
            label: item.recipeName ?? item.nombre ?? item.name ?? String(item),
            value: item.recipeName ?? item.nombre ?? item.name ?? String(item)
          }))
        ];
      },
      error: (err) => {
        console.error('Error al cargar recetas', err);
      }
    });
  }

  cargar(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      console.warn('Fecha inicio y fecha fin son obligatorias');
      return;
    }

    const startDate = this.formatearFecha(this.fechaInicio);
    const endDate = this.formatearFecha(this.fechaFin);

    const objectName =
      !this.objetoSeleccionado || this.objetoSeleccionado === 'Todas'
        ? undefined
        : this.objetoSeleccionado;

    const recipeName =
      !this.recetaSeleccionada || this.recetaSeleccionada === 'Todas'
        ? undefined
        : this.recetaSeleccionada;

    const station =
      this.estacionSeleccionada === null
        ? undefined
        : this.estacionSeleccionada;

    this.graficasService.SanitationProcesses(
      startDate,
      endDate,
      station,
      objectName,
      recipeName
    ).subscribe({
      next: (resp) => {

        console.log('RESPUESTA BACKEND:', resp);

        const lista =
          Array.isArray(resp.data) ? resp.data :
          Array.isArray(resp.data?.data) ? resp.data.data :
          Array.isArray(resp.data?.procesos) ? resp.data.procesos :
          [];

        // 🔥 DEBUG CLAVE
        console.log('LISTA COMPLETA:', lista);
        console.log('PRIMER ITEM:', lista[0]);
        console.log('DURATION DEL PRIMER ITEM:', lista[0]?.duration);

        this.registros = lista.map((item: any) => ({
          id: item.id,

          fecha: this.formatearFechaTabla(item.startTime),
          fechaRaw: new Date(item.startTime),

          folio: item.id,
          estacion: item.station,
          circuito: item.objectName,
          receta: item.recipeName,
          usuario: item.userName,

          // 🔥 CLAVE
          duracion: item.duration
        }));

        console.log('REGISTROS FINALES:', this.registros);
      },

      error: (err) => {
        console.error('Error al cargar procesos de saneamiento', err);
      }
    });
  }

  generarReporte(): void {
    if (!this.registroSeleccionado?.id) {
      console.warn('Selecciona un registro para generar reporte');
      return;
    }

    this.graficasService.SanitationReport(this.registroSeleccionado.id).subscribe({
      next: (resp) => {

        const data = resp.data;

        this.reporte = data;
        this.steps = data.steps ?? [];
        this.rawData = data.rawData ?? [];

        this.procesarGraficas();

        this.mostrarReporte = true;

      }
    });
  }

  private procesarGraficas(): void {

    if (!this.rawData || this.rawData.length === 0) {
      console.warn("No hay datos para graficar");
      return;
    }

    const labels = this.rawData.map((d: any) =>
      new Date(d.tiempo).toLocaleTimeString()
    );

    // TEMPERATURA
    this.chartTemperatura = {
      labels: labels,
      datasets: [
        {
          label: 'Meta',
          data: this.rawData.map((d: any) => d.spTemp),
          borderColor: 'black',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0,
          stepped: true
        },
        {
          label: 'Retorno',
          data: this.rawData.map((d: any) => d.returnTemp),
          borderColor: 'green',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0
        },
        {
          label: 'Suministro',
          data: this.rawData.map((d: any) => d.supplyTemp),
          borderColor: 'red',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0
        }
      ]
    };

    // CONCENTRACIÓN
    this.chartConcentracion = {
      labels: labels,
      datasets: [
        {
          label: 'Meta',
          data: this.rawData.map((d: any) => d.spCond),
          borderColor: 'black',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0,
          stepped: true
        },
        {
          label: 'Retorno',
          data: this.rawData.map((d: any) => d.returnCond),
          borderColor: 'blue',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0
        }
      ]
    };

    // FLUJO
    this.chartFlujo = {
      labels: labels,
      datasets: [
        {
          label: 'Meta',
          data: this.rawData.map((d: any) => d.spFlow),
          borderColor: 'black',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0,
          stepped: true
        },
        {
          label: 'Suministro',
          data: this.rawData.map((d: any) => d.supplyFlow),
          borderColor: 'purple',
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0
        }
      ]
    };

    console.log("Gráficas listas");
  }

  cancelar(): void {
    this.fechaInicio = new Date();
    this.fechaFin = new Date();
    this.estacionSeleccionada = 1;
    this.objetoSeleccionado = null;
    this.recetaSeleccionada = null;
    this.registroSeleccionado = null;
    this.registros = [];
  }

  private formatearFechaTabla(fechaIso: string): string {
    const fecha = new Date(fechaIso);

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    let horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');

    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12;
    horas = horas === 0 ? 12 : horas;

    return `${dia}/${mes}/${anio} ${String(horas).padStart(2, '0')}:${minutos}:${segundos} ${ampm}`;
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  exportarExcel(): void {
    if (!this.registros || this.registros.length === 0) {
      console.warn('No hay registros para exportar');
      return;
    }

    // Preparar los datos para el Excel
    const datosExport = this.registros.map(registro => ({
      'Fecha': registro.fecha,
      'Folio': registro.folio,
      'Estación': registro.estacion,
      'Circuito': registro.circuito,
      'Receta': registro.receta,
      'Usuario': registro.usuario
    }));

    // Crear el workbook y la hoja
    const worksheet = XLSX.utils.json_to_sheet(datosExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 25 },  // Fecha
      { wch: 12 },  // Folio
      { wch: 12 },  // Estación
      { wch: 20 },  // Circuito
      { wch: 20 },  // Receta
      { wch: 15 }   // Usuario
    ];
    worksheet['!cols'] = colWidths;

    // Generar el nombre del archivo con la fecha actual
    const ahora = new Date();
    const fecha = `${ahora.getDate().toString().padStart(2, '0')}-${(ahora.getMonth() + 1).toString().padStart(2, '0')}-${ahora.getFullYear()}`;
    const hora = `${ahora.getHours().toString().padStart(2, '0')}-${ahora.getMinutes().toString().padStart(2, '0')}`;
    const nombreArchivo = `Registros_Saneamiento_${fecha}_${hora}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(workbook, nombreArchivo);
    console.log('Excel exportado exitosamente');
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { GraficasService } from '../core/graficas.services';
import { ChartModule } from 'primeng/chart';
import { SanitationReportView } from '../core/components/sanitation-report-view/sanitation-report-view.component';

@Component({
  selector: 'app-genera-graficas-saneamientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    SanitationReportView
  ],
  templateUrl: './GeneraGraficaSaneamientos.html',
  styleUrls: ['./GeneraGraficaSaneamientos.scss']
})
export class GeneraGraficaSaneamientos implements OnInit {
  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();

  estaciones = [
    { label: '1', value: 1 },
    { label: '2', value: 2 }
  ];

  objetos = [
    { label: 'Todas', value: null }
  ];

  recetas = [
    { label: 'Todas', value: null }
  ];

  estacionSeleccionada: number = 1;
  objetoSeleccionado: string | null = null;
  recetaSeleccionada: string | null = null;
  mostrarReporte = false;

  columnaActiva: string | null = null;
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

  constructor(private graficasService: GraficasService) {}

  ngOnInit(): void {
    this.cargarObjetos();
    this.cargarRecetas();
  }

  seleccionarColumna(columna: string): void {
    this.columnaActiva = this.columnaActiva === columna ? null : columna;
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
    if (!this.fechaInicio || !this.fechaFin || this.estacionSeleccionada == null) {
      console.warn('Fecha inicio, fecha fin y estacion son obligatorias');
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

    this.graficasService.SanitationProcesses(
      startDate,
      endDate,
      this.estacionSeleccionada,
      objectName,
      recipeName
    ).subscribe({
      next: (resp) => {
        console.log('Procesos de saneamiento:', resp);

        const lista =
          Array.isArray(resp.data) ? resp.data :
          Array.isArray(resp.data?.data) ? resp.data.data :
          Array.isArray(resp.data?.procesos) ? resp.data.procesos :
          [];

      this.registros = lista.map((item: any) => ({
        id: item.id,
        fecha: this.formatearFechaTabla(item.startTime),
        folio: item.id,
        estacion: item.station,
        circuito: item.objectName,
        receta: item.recipeName,
        usuario: item.userName
      }));
        console.log('Registros finales:', this.registros);
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
          fill: false
        },
        {
          label: 'Retorno',
          data: this.rawData.map((d: any) => d.returnTemp),
          borderColor: 'green',
          fill: false
        },
        {
          label: 'Suministro',
          data: this.rawData.map((d: any) => d.supplyTemp),
          borderColor: 'red',
          fill: false
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
          fill: false
        },
        {
          label: 'Retorno',
          data: this.rawData.map((d: any) => d.returnCond),
          borderColor: 'blue',
          fill: false
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
          fill: false
        },
        {
          label: 'Suministro',
          data: this.rawData.map((d: any) => d.supplyFlow),
          borderColor: 'purple',
          fill: false
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
    this.columnaActiva = null;
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
}
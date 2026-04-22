import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { GraficasService } from '../core/graficas.services';

@Component({
  selector: 'app-genera-grafica-saneamientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    CalendarModule
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

  columnaActiva: string | null = null;
  registroSeleccionado: any = null;

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
        console.log('Reporte:', resp);
      },
      error: (err) => {
        console.error('Error al generar reporte', err);
      }
    });
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
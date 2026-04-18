import { Component, EventEmitter, Output, HostListener, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Componentes, ComponentsService } from '../../components.service';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { GuardaComponente } from '../../../../interfaces/GuardaComponente';
import { firstValueFrom, of, Observable } from 'rxjs';
import { concatMap, finalize } from 'rxjs/operators';
import { ApiResponseDTO } from '../../../../interfaces/ApiResponse'; 
import { AuthService } from '../../auth.service';


@Component({
  selector: 'app-componentes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule,
  ToastModule,ConfirmDialogModule,DialogModule,InputTextModule,ButtonModule],
  templateUrl: './componentes-modal.component.html',
  styleUrls: ['./componentes-modal.component.scss'],
  providers: [DatePipe, ConfirmationService]
})
export class ComponentesModalComponent implements OnInit, OnDestroy {

  @Output() cerrarModal = new EventEmitter<void>();
  @ViewChild('componenteForm') componenteForm!: NgForm;
  private recetasService = inject(ComponentsService)
  private toast = inject(MessageService);

  constructor(private datePipe: DatePipe,
  private confirmationService: ConfirmationService,
  private messageService: MessageService,
  private auth: AuthService
  ) {}

  public componentes: { label: string, value: string }[] = [];
  public mass: number = 0;
  public water: number = 0;
  public temp: number = 0;
  public type: number = 0;
  public version: number = 0;
  public agitacionHora: number = 0;
  public agitacionMinuto: number = 0;
  public agitacionSegundo: number = 0;
  public tipo: number = 0;
  public comments: string = "";
  public componenteSeleccionado: string = "";
  public id: string = "";
  public name: string = "";
  public recipeReference: string = "";
  public agitacionDuracion: string = "";
  public updateTimeFormateado: string = "";
  public comentarios: string = "";
  public origen: 'tanque' | 'bayoneta' | '' = '';
  public idNuevoComponente: string = "";
  public nombreNuevoComponente: string = "";
  public referenciaNuevoComponente: string = "";
  public tipoNuevoComponente: string = "";
  public idValidaNoObsoleto: string = "";
  public idValidaObsoleto: string = "";

  public obsolete: boolean = false;
  public hard: boolean = false;
  public circulate: boolean = false;
  public noInventoryValidation: boolean = false;
  public liquidsTank: boolean = false;
  public directWaterLoad: boolean = false;
  public banderaUltimoCambio: boolean = false;
  public banderaIdentificador: boolean = false;
  public banderaNombre: boolean = false;
  public banderaTipo: boolean = false;
  public banderaRecircular: boolean = false;
  public banderaDisolucionDificil: boolean = false;
  public banderaBayoneta: boolean = false;
  public banderaMasa: boolean = false;
  public banderaAgua: boolean = false;
  public banderaAutomatica: boolean = false;
  public banderaHora: boolean = false;
  public banderaMinuto: boolean = false;
  public banderaSegundo: boolean = false;
  public banderaComentarios: boolean = false;
  public banderaGuardar: boolean = false;
  public banderaEliminar: boolean = false;
  public banderaReferencia: boolean = false;
  public banderaCargaDirecta: boolean = false;
  public banderaTanque: boolean = false;
  public banderaInventario: boolean = false;
  public recircular: boolean = false;
  public dificilDisolucion: boolean = false;
  public bayoneta: boolean = false;
  public tanque: boolean = false;
  public agitacionAutomatica: boolean = false;
  public cargaDirecta: boolean = false;
  public inventario: boolean = false;
  public banderaMostrarDialogo: boolean = false;
  public isSaving: boolean = false;
  public soloLectura: boolean = false;



  // Detectar tecla Escape
  @HostListener('document:keydown.escape', ['$event'])
  onEscPressed(event: KeyboardEvent) {
    this.intentarCerrar();
  }

  onOrigenChange(val: 'tanque' | 'bayoneta' | ''): void {
    this.origen = val;
    this.bayoneta = (val === 'bayoneta'); 
  }

  inicializaComponentes(): void {
    this.mass = 0;
    this.water = 0;
    this.temp = 0;
    this.type = 0;
    this.version = 0;
    this.agitacionHora = 0;
    this.agitacionMinuto = 0;
    this.agitacionSegundo = 0;
    this.tipo = 0;
    this.comments = "";
    this.componenteSeleccionado = "";
    this.id = "";
    this.name = "";
    this.recipeReference = "";
    this.agitacionDuracion = "";
    this.updateTimeFormateado = "";
    this.comentarios = "";
    this.origen = "";
    this.obsolete = false;
    this.hard = false;
    this.circulate = false;
    this.noInventoryValidation = false;
    this.liquidsTank = false;
    this.directWaterLoad = false;
    this.banderaUltimoCambio = false;
    this.banderaIdentificador = false;
    this.banderaNombre = false;
    this.banderaTipo = false;
    this.banderaRecircular = false;
    this.banderaDisolucionDificil = false;
    this.banderaBayoneta = false;
    this.banderaMasa = false;
    this.banderaAgua = false;
    this.banderaAutomatica = false;
    this.banderaHora = false;
    this.banderaMinuto = false;
    this.banderaSegundo = false;
    this.banderaComentarios = false;
    this.banderaGuardar = false;
    this.banderaEliminar = false;
    this.banderaReferencia = false;
    this.banderaCargaDirecta = false;
    this.banderaTanque = false;
    this.banderaInventario = false;
    this.recircular = false;
    this.dificilDisolucion = false;
    this.bayoneta = false;
    this.tanque = false;
    this.agitacionAutomatica = false;
    this.cargaDirecta = false;
    this.inventario = false;
  }

  tipos = [
    { label: '-', value: 0 },
    { label: 'Sólido', value: 1 },
    { label: 'Líquido', value: 2 }
  ];

  onComponenteSeleccionado(event: any): void {
    const valorSeleccionado = event.value;
    this.id = valorSeleccionado;
    
    this.obtenerComponentesCompleto();
    this.validaEliminar();
  }

  onlyNumberAndPoint(event: KeyboardEvent, model: any): void {
    const input = event.target as HTMLInputElement;

    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      return;
    }

    if (!/[0-9.]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === '.' && input.value.includes('.')) {
      event.preventDefault();
      return;
    }
  }

  onlyInteger(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      return;
    }

    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
      return;
    }
  }

  ngOnInit(): void {

    this.soloLectura = this.auth.isOperador();
    document.body.style.overflow = 'hidden';

    this.recetasService.obtenerComponentes().subscribe({
      next: (response: any) => {
        const data: Componentes[] = response.data;

        this.componentes = data.map((item) => ({
          label: item.componentes,
          value: item.id
        }));

      },
      error: (err) => console.error('Error al obtener componentes', err)
    });
  }

  onAgitacionAutomaticaChange(value: boolean): void {
    this.agitacionAutomatica = value;

    if (!value) {
      this.agitacionHora = 0;
      this.agitacionMinuto = 0;
      this.agitacionSegundo = 0;
    }
  }

  onRecircularChange(value: boolean): void {

    if(value) {
      this.banderaDisolucionDificil = false;
    }else{
      this.banderaDisolucionDificil = true;
    }
  }

  onDisolucionChange(value: boolean): void {

    if(value) {

      this.banderaRecircular = false;
      this.banderaCargaDirecta = true;
    }else{

      this.banderaRecircular = true;
      this.banderaCargaDirecta = false;
      this.cargaDirecta = false;
    }
  }

  onTipoAutomaticaChange(value: number): void {

    if(value == 1)
    {
      this.banderaTanque = false;
      this.banderaBayoneta = false;
      this.banderaRecircular = true;
      this.banderaDisolucionDificil = true;
      this.banderaCargaDirecta = false;
      this.banderaAutomatica = true;

      this.recircular = false;
      this.dificilDisolucion = false;
      this.cargaDirecta = false;
      this.agitacionAutomatica = false;
      this.origen = "";
      this.agitacionHora = 0;
      this.agitacionMinuto = 0;
      this.agitacionSegundo = 0;

    }else if(value == 2)
    {
      this.banderaTanque = true;
      this.banderaBayoneta = true;
      this.banderaRecircular = false;
      this.banderaDisolucionDificil = false;
      this.banderaCargaDirecta = false;
      this.banderaAutomatica = false;

      this.recircular = false;
      this.dificilDisolucion = false;
      this.cargaDirecta = false;
      this.agitacionAutomatica = false;
      this.origen = "";
      this.agitacionHora = 0;
      this.agitacionMinuto = 0;
      this.agitacionSegundo = 0;

    }else if(value == 0)
    {
      this.banderaTanque = false;
      this.banderaBayoneta = false;
      this.banderaRecircular = false;
      this.banderaDisolucionDificil = false;
      this.banderaCargaDirecta = false;
      this.banderaAutomatica = false;

      this.recircular = false;
      this.dificilDisolucion = false;
      this.cargaDirecta = false;
      this.agitacionAutomatica = false;
      this.origen = "";
      this.agitacionHora = 0;
      this.agitacionMinuto = 0;
      this.agitacionSegundo = 0;

    }
  }

  public validaEliminar(): void {

    this.recetasService.validaBtnEliminar(this.id).subscribe({
      next: (response: any) => {

        if(response.data == null){

          this.banderaEliminar = true;
        }else{

          this.banderaEliminar = false;
        }
      }
    })
  }

  public eliminar(): void {
    this.confirmationService.confirm({
      message: '¿Realmente desea eliminar el componente?\nEsta función actualizará el listado de elementos.',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button p-button-sm p-button-danger p-button-outlined',
      rejectButtonStyleClass: 'p-button p-button-sm p-button-secondary p-button-text',
      accept: () => {
        this.recetasService.eliminar(this.id).subscribe({
          next: (response: any) => {
            this.toast.add({
              severity: 'success',
              summary: 'Componente eliminado',
              detail: 'El componente ha sido eliminado correctamente.'
            });
            this.inicializaComponentes();
            this.recetasService.obtenerComponentes().subscribe({
              next: (response: any) => {
                const data: Componentes[] = response.data;

                this.componentes = data.map((item) => ({
                  label: item.componentes, 
                  value: item.id
                }));

              },
              error: (err) => console.error('Error al obtener componentes', err)
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el componente.'
            });
          }
        });
      }
    });

  }

  public obtenerComponentesCompleto(): void {
    this.recetasService.obtenerComponentesCompleto(this.id).subscribe({
      next: (response: any) => {

        this.banderaNombre = true;
        this.banderaTipo = true;
        this.banderaReferencia = true;
        this.banderaMasa = true;
        this.banderaAgua = true;
        this.banderaInventario = true;
        this.banderaComentarios = true;
        this.banderaGuardar = true;

        const agDur = response.data.agitationDuration ?? '';
        const match = agDur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        this.agitacionHora   = match?.[1] ? parseInt(match[1], 10) : 0;
        this.agitacionMinuto = match?.[2] ? parseInt(match[2], 10) : 0;
        this.agitacionSegundo = match?.[3] ? parseInt(match[3], 10) : 0;

        const raw = new Date(response.data.updateTime);
        this.updateTimeFormateado = this.datePipe.transform(raw, 'dd/MM/yyyy hh:mm:ss a') ?? '';

        this.agitacionDuracion = agDur;
        this.name = response.data.name;
        this.recipeReference = response.data.recipeReference;
        this.mass = response.data.mass;
        this.water = response.data.water;
        this.cargaDirecta = response.data.directWaterLoad;
        this.recircular = response.data.circulate;
        this.dificilDisolucion = response.data.hard;

        this.bayoneta = !!response.data.bayonet;
        this.tanque   = false;

        if (!response.data.bayonet && !response.data.liquidsTank) {
          this.origen = 'tanque';
        } else {
          this.origen = this.bayoneta ? 'bayoneta' : 'tanque';
        }

        this.onOrigenChange(this.origen);

        this.agitacionAutomatica = response.data.agitationAutomatic;
        this.comentarios = response.data.comments;
        this.tipo = response.data.type;
        this.inventario = response.data.noInventoryValidation;
        this.version = response.data.version;

        if (this.tipo == 1) {
          this.banderaTanque = false;
          this.banderaBayoneta = false;
          this.banderaRecircular = true;
          this.banderaDisolucionDificil = true;
          this.banderaCargaDirecta = false;
          this.banderaAutomatica = true;

        } else if (this.tipo == 2) {
          this.banderaTanque = true;
          this.banderaBayoneta = true;
          this.banderaRecircular = false;
          this.banderaDisolucionDificil = false;
          this.banderaCargaDirecta = false;
          this.banderaAutomatica = false;

        } else if (this.tipo == 0) {
          this.banderaTanque = false;
          this.banderaBayoneta = false;
          this.banderaRecircular = false;
          this.banderaDisolucionDificil = false;
          this.banderaCargaDirecta = false;
          this.banderaAutomatica = false;
        }

        if (this.recircular) {
          this.banderaDisolucionDificil = false;
          this.banderaCargaDirecta = false;

        } else if (this.dificilDisolucion) {
          this.banderaRecircular = false;
          this.banderaCargaDirecta = true;
        }
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  intentarCerrar() {
    if (this.componenteForm?.dirty) {
      const confirmar = confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardar?');
      if (!confirmar) return;
    }
    this.cerrar();
  }

  cerrar() {
    this.cerrarModal.emit();
  }

  public async validaNoObsoleto(): Promise<void> {
    const response = await this.recetasService.validaNoObsoleto(this.idNuevoComponente).toPromise();
    this.idValidaNoObsoleto = response?.data;

    if (this.idValidaNoObsoleto == null) {
      await this.validaObsoleto();

      if (this.idValidaObsoleto != "") {

        this.confirmationService.confirm({
          message: 'Identificador existente como obsoleto. ¿Desea restablecer el registro para realizar modificaciones?',
          header: 'Confirmación',
          icon: 'pi pi-question-circle',
          acceptLabel: 'Sí',
          rejectLabel: 'No',
          acceptButtonStyleClass: 'p-button-success',
          rejectButtonStyleClass: 'p-button-secondary',
          accept: () => {
            this.actualizaComponente();
          },
          reject: () => {
          }
        });

      } else {
        this.creaComponente();
      }
    } else {
          this.messageService.add({
          severity: 'info',
          summary: 'Crear',
          detail: 'Identificador existente. Verifique la información e intente nuevamente.',
          life: 3000,
        });
    }

  }

  public async validaObsoleto(): Promise<void> {

    const response = await this.recetasService.validaObsoleto(this.idNuevoComponente).toPromise();
    this.idValidaObsoleto = response?.data || "";
  }


  public creaComponente(): void {
    this.recetasService.creaComponente(
      this.idNuevoComponente,
      this.nombreNuevoComponente,
      this.referenciaNuevoComponente,
      this.tipoNuevoComponente
    ).subscribe({
      next: (response: any) => {
        
        this.toast.add({
          severity: 'success',
          summary: 'Componente creado',
          detail: 'El componente fue creado exitosamente.'
        });

        this.limpiaCreaComponente();
        this.ngOnInit();
      },
      error: (error) => {
        console.error('Error al crear componente: ', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el componente.',
          life: 3000
        });
      }
    });
  }


  public actualizaComponente(): void{

    this.recetasService.actualizaComponente(this.idNuevoComponente).subscribe({
      next: (response: any) => {

        this.toast.add({
          severity: 'success',
          summary: 'Crear',
          detail: 'Componente Actualizado'
        });
        this.limpiaCreaComponente();
        this.ngOnInit();

      }
      
    })

  }

  public limpiaCreaComponente(): void {
    
      this.idNuevoComponente = "";
      this.nombreNuevoComponente = "";
      this.referenciaNuevoComponente = "";
      this.tipoNuevoComponente = "";
      this.banderaMostrarDialogo = false;
  }

  private buildIsoDuration(h: number, m: number, s: number): string {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}H`);
    if (m > 0) parts.push(`${m}M`);
    if (s > 0) parts.push(`${s}S`);
    return parts.length ? `PT${parts.join('')}` : 'PT0S';
  }

  private buildComponentePayload(): GuardaComponente {
    
    const h = Number(this.agitacionHora)   || 0;
    const m = Number(this.agitacionMinuto) || 0;
    const s = Number(this.agitacionSegundo)|| 0;

    const mm = (m % 60 + 60) % 60;
    const ss = (s % 60 + 60) % 60;
    const hh = (h || 0) + Math.floor(m / 60) + Math.floor(s / 3600);

    const isoAgitation = this.agitacionAutomatica
      ? this.buildIsoDuration(hh, mm, ss)
      : 'PT0S';

    return {
      id: this.id,
      name: this.name,
      recipeReference: this.recipeReference,
      mass: this.mass,
      water: this.water,
      temp: this.temp,
      obsolete: this.obsolete,
      comments: this.comentarios,
      type: this.tipo,
      version: this.version + 1,
      bayonet: this.bayoneta,
      hard: this.dificilDisolucion,
      agitationAutomatic: !!this.agitacionAutomatica,
      agitationDuration: isoAgitation,              
      circulate: this.recircular,
      noInventoryValidation: this.inventario,
      liquidsTank: false,
      directWaterLoad: this.cargaDirecta
    };
  }

  private guardarComponente$(): Observable<ApiResponseDTO> {

    const componente = this.buildComponentePayload();

    return this.recetasService.guardaComponente(componente);

  }

  public guardarComponente(): void {

    this.guardarComponente$().subscribe({
      next: (_) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Componentes',
          detail: 'Guardado Exitoso',
          life: 3000,
        });
        this.inicializaComponentes();
        setTimeout(() => this.cerrar(), 0);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el componente',
          life: 4000,
        });
      }
    });
  }

  public actualizaGuardadoComponente(): void {
    this.recetasService.actualizaGuardadoComponente(this.id).subscribe({
      next: (response: any) => {

        this.guardarComponente();
      },
      error: (err) => {
        console.error('Error en actualizaGuardadoComponente:', err);
      }
    });
  }

  private actualizarLuegoGuardar(): void {

    if (this.isSaving) return;
    this.isSaving = true;

    this.recetasService.actualizaGuardadoComponente(this.id).pipe(
      concatMap(() => this.guardarComponente$()),
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (_) => {
        this.toast.add({
          severity: 'success',
          summary: 'Componentes',
          detail: 'Actualizado y guardado con éxito'
        });

        this.inicializaComponentes();
        setTimeout(() => this.cerrar(), 0);
      },
      error: (err) => {
        console.error('Error en actualizar→guardar:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo completar el guardado',
          life: 4000,
        });
      }
    });
  }

  public guardado(): void {
    
    this.confirmationService.confirm({
      message: '¿Está seguro de guardar el componente? Esta función actualizará el listado de elementos.',
      header: 'Guardar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.actualizarLuegoGuardar(),
    });
  }

  get nuevaIdValida()        { return this.idNuevoComponente.trim().length > 0; }
  get nuevaNombreValida()    { return this.nombreNuevoComponente.trim().length > 0; }
  get nuevaRefValida()       { return this.referenciaNuevoComponente.trim().length > 0; }
  get nuevoTipoValido() { return !!this.tipoNuevoComponente && this.tipoNuevoComponente !== '-'; }

  get puedeCrearNueva() {
    return this.nuevaIdValida && this.nuevaNombreValida && this.nuevaRefValida && this.tipoNuevoComponente;
  }

}
import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoginService, Usuario, Role } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ToastModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() cerrarModal = new EventEmitter<void>();

  private api = inject(LoginService);
  private toast = inject(MessageService);
  private auth = inject(AuthService);

  usuarios: Usuario[] = [];
  filtrados: Usuario[] = [];
  seleccionado: Usuario | null = null;

  loading = false;
  creando = false;
  editando = false;

  // Confirmar edición (overlay)
  confirmEditOpen = false;
  confirmPass = '';
  confirmShowPass = false;
  confirmLoading = false;

  // Crear
  showPass = false;
  nuevo = { username: '', pass: '', role: 'OPERADOR' as Role };

  // Editar
  edit: Usuario | null = null;
  editPass = '';
  showEditPass = false;

  esAdmin = false;

  // Filtros
  filtroTexto = '';
  filtroRol: Role | 'TODOS' = 'TODOS';
  rolesOptions = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Administrador', value: 'ADMINISTRADOR' },
    { label: 'Supervisor', value: 'SUPERVISOR' },
    { label: 'Operador', value: 'OPERADOR' },
  ];

  ngOnInit(): void {
    this.esAdmin = ((this.auth.getRoleSnapshot() || '').toUpperCase() === 'ADMINISTRADOR');
    this.auth.role$.subscribe(r => this.esAdmin = ((r || '').toUpperCase() === 'ADMINISTRADOR'));
    if (this.visible) this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && !this.usuarios.length) this.cargar();
  }

  cerrar() { this.cerrarModal.emit(); }

  //  Datos / filtros
  cargar() {
    this.loading = true;
    this.api.consultaUsuarios().subscribe({
      next: (users) => {
        this.usuarios = users;
        this.aplicarFiltros();
        this.seleccionado = this.filtrados[0] ?? null;
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener la lista de usuarios.' }),
      complete: () => this.loading = false,
    });
  }

  aplicarFiltros() {
    const t = (this.filtroTexto || '').trim().toLowerCase();
    const r = this.filtroRol;

    this.filtrados = this.usuarios.filter(u => {
      const matchTexto = !t || u.username.toLowerCase().includes(t) || String(u.id).includes(t);
      const matchRol   = r === 'TODOS' || u.role === r;
      return matchTexto && matchRol;
    });

    if (this.seleccionado && !this.filtrados.some(u => u.id === this.seleccionado!.id)) {
      this.seleccionado = this.filtrados[0] ?? null;
    }
  }

  seleccionar(u: Usuario) {
    if (this.creando || this.editando) return;
    this.seleccionado = u;
  }

  // Crear
  abrirCrear() {
    if (!this.esAdmin) return;
    this.creando = true;
    this.editando = false;
    this.nuevo = { username: '', pass: '', role: 'OPERADOR' };
    this.showPass = false;
  }
  cancelarCrear() { this.creando = false; }

  puedeGuardarNuevo(): boolean {
    const u = (this.nuevo.username || '').trim();
    const p = (this.nuevo.pass || '').trim();
    return !!u && u.length >= 3 && !!p && p.length >= 6 && !!this.nuevo.role;
  }

  guardarNuevo() {
    if (!this.puedeGuardarNuevo()) return;
    this.loading = true;

    this.api.nuevoUsuario(this.nuevo.username.trim(), this.nuevo.pass.trim(), this.nuevo.role).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Usuario creado', detail: 'El usuario se creó correctamente.' });
        const creado = this.nuevo.username.trim();
        this.creando = false;
        this.cargarDespuesDeCrear(creado);
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo crear el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
      complete: () => this.loading = false
    });
  }

  private cargarDespuesDeCrear(usernameRecienCreado: string) {
    this.loading = true;
    this.api.consultaUsuarios().subscribe({
      next: (users) => {
        this.usuarios = users;
        this.aplicarFiltros();
        this.seleccionado = this.usuarios.find(u => u.username === usernameRecienCreado) ?? this.filtrados[0] ?? null;
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo refrescar la lista.' }),
      complete: () => this.loading = false
    });
  }

  // Editar 
  get puedeEditar(): boolean {
    return this.esAdmin && !!this.seleccionado && this.seleccionado.id !== 1;
  }

  pedirClaveYEntrarEdicion() {
    if (!this.puedeEditar) {
      this.toast.add({ severity: 'warn', summary: 'Acción denegada', detail: 'Este usuario no se puede editar.' });
      return;
    }
    this.confirmPass = '';
    this.confirmShowPass = false;
    this.confirmEditOpen = true;
  }

  closeConfirm() {
    this.confirmEditOpen = false;
    this.confirmPass = '';
    this.confirmShowPass = false;
  }

  private getCurrentUserName(): string {
    try {
      return (typeof window !== 'undefined')
        ? (localStorage.getItem('auth_user_name') || '')
        : '';
    } catch { return ''; }
  }

  confirmProceed() {
    const pass = (this.confirmPass || '').trim();
    if (!pass) return;

    const userName = this.getCurrentUserName();
    if (!userName) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener el usuario actual.' });
      return;
    }

    this.confirmLoading = true;
    this.api.validaLogin(userName, pass).subscribe({
      next: () => {
        this.confirmLoading = false;
        this.closeConfirm();

        this.creando = false;
        this.editando = true;
        this.edit = this.seleccionado ? { ...this.seleccionado } : null;
        this.editPass = '';
      },
      error: () => {
        this.confirmLoading = false;
        this.toast.add({ severity: 'error', summary: 'Contraseña inválida', detail: 'La contraseña no coincide.' });
      }
    });
  }

  cancelarEdicion() {
    this.editando = false;
    this.edit = null;
    this.editPass = '';
    this.showEditPass = false;
  }

  private nombreEnUso(name: string, idActual: number): boolean {
    const n = (name || '').trim().toLowerCase();
    return this.usuarios.some(u => u.id !== idActual && u.username.toLowerCase() === n);
  }

  puedeGuardarEdicion(): boolean {
    if (!this.edit) return false;
    const u = (this.edit.username || '').trim();
    const r = this.edit.role;
    if (!u || u.length < 3) return false;
    if (!r) return false;
    if (this.nombreEnUso(u, this.edit.id)) return false;

    const p = (this.editPass || '').trim();
    if (p && p.length < 6) return false;
    return true;
  }

  guardarEdicion() {
    if (!this.edit || !this.puedeGuardarEdicion()) return;

    const { id, username, role } = this.edit;
    const pass = (this.editPass || '').trim();
    this.loading = true;

    this.api.actualizarUsuario(username.trim(), pass, role, id).subscribe({
      next: () => {
        const idx = this.usuarios.findIndex(x => x.id === id);
        if (idx >= 0) this.usuarios[idx] = { id, username: username.trim(), role };
        this.aplicarFiltros();
        this.seleccionado = this.usuarios.find(x => x.id === id) ?? null;

        this.toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado correctamente.' });
        this.cancelarEdicion();
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo actualizar el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
      complete: () => this.loading = false
    });
  }

  // Eliminar 
  get puedeEliminar(): boolean {
    if (!this.esAdmin) return false;
    if (!this.seleccionado) return false;
    if (this.creando || this.editando || this.loading) return false;
    return true;
  }

  eliminarSeleccionado() {
    if (!this.puedeEliminar || !this.seleccionado) return;

    if (this.seleccionado.id === 1) {
      this.toast.add({
        severity: 'warn',
        summary: 'Acción denegada',
        detail: 'El usuario administrador (ID 1) no se puede eliminar.'
      });
      return;
    }

    const { id, username } = this.seleccionado;
    const ok = window.confirm(`¿Eliminar al usuario "${username}" (ID ${id})? Esta acción no se puede deshacer.`);
    if (!ok) return;

    this.loading = true;
    this.api.eliminarUsuario(id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Eliminado', detail: `Usuario "${username}" eliminado correctamente.` });
        this.usuarios = this.usuarios.filter(u => u.id !== id);
        this.aplicarFiltros();
        this.seleccionado = this.filtrados[0] ?? null;
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo eliminar el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
      complete: () => this.loading = false
    });
  }
}
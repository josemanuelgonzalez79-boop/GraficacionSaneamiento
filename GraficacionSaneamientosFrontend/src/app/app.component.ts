import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common'; // <-- *ngIf / ngFor y ngSrc
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from './core/services/auth.service';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,        // <-- habilita *ngIf, *ngFor, etc.
    NgOptimizedImage,    // <-- habilita [ngSrc] y "priority" en <img>
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    ToastModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService],
})
export class AppComponent implements OnInit {

  visibleMenu: string | null = null;
  mostrarUsuarios = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  private auth = inject(AuthService);

  isAuth$: Observable<boolean> = this.auth.isAuthenticated$;

  isAdmin$: Observable<boolean> = this.auth.role$.pipe(
    map(r => r === 'ADMINISTRADOR')
  );

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {}

  showSubmenu(menu: string): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.visibleMenu = menu;
  }

  hideSubmenu(menu: string): void {
    this.closeTimer = setTimeout(() => {
      if (this.visibleMenu === menu) this.visibleMenu = null;
    }, 180);
  }

  toggleSubmenu(menu: string): void {
    this.visibleMenu = this.visibleMenu === menu ? null : menu;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.menu')) this.visibleMenu = null;
  }

  // Navegación / Modales
  navegar(ruta: string): void {
    this.visibleMenu = null;

    if (ruta === 'usuarios') {
      if (this.auth.getRoleSnapshot() !== 'ADMINISTRADOR') return;
      this.mostrarUsuarios = true;
      return;
    }
  }

  cerrarModalComponentes(): void {
    this.mostrarUsuarios = false;
  }

  // Logout 
  onLogout() {
    this.auth.logout();
  }
}

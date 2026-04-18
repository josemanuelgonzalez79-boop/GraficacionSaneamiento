// core/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type Role = 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isBrowser: boolean;
  private authState = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.authState.asObservable();

  private roleState = new BehaviorSubject<Role | null>(null);
  role$ = this.roleState.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreFromStorage();
  }

  private restoreFromStorage() {
    if (!this.isBrowser) { this.authState.next(false); return; }
    const token = localStorage.getItem('auth_token');
    const role  = localStorage.getItem('auth_role') as Role | null;
    this.authState.next(!!token || localStorage.getItem('isAuthenticated') === 'true');
    this.roleState.next(role);
  }

  //  ahora recibe y guarda el rol también
  markLoggedIn(userId: string, userName: string, role: Role) {
    if (!this.isBrowser) return;
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('auth_user_id', userId);
    localStorage.setItem('auth_user_name', userName);
    localStorage.setItem('auth_role', role);
    this.authState.next(true);
    this.roleState.next(role);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('auth_user_name');
      localStorage.removeItem('auth_role');
    }
    this.authState.next(false);
    this.roleState.next(null);
  }

  // útil para leer el rol inmediato
  getRoleSnapshot(): Role | null { return this.roleState.value; }

  isOperador(): boolean    { return this.roleState.value === 'OPERADOR'; }
  isAdmin(): boolean       { return this.roleState.value === 'ADMINISTRADOR'; }
  isSupervisor(): boolean  { return this.roleState.value === 'SUPERVISOR'; }

  // core/services/auth.service.ts
  isLoggedInSnapshot(): boolean {
    return this.authState.value;
  }

}

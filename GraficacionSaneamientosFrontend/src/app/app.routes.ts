// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './core/components/login/login.component';
import { loginRedirectGuard } from './core/guards/login-redirect.guard';

export const routes: Routes = [

  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
  { path: 'login', loadComponent: () => import('././core/components/login/login.component').then(m => m.LoginComponent), canActivate: [loginRedirectGuard] },
  { path: '',     loadComponent: () => import('./../app/app.component').then(m => m.AppComponent), canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];
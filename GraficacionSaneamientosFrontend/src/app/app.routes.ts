import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'graficas-saneamientos',
    pathMatch: 'full'
  },
  {
    path: 'graficas-saneamientos',
    loadComponent: () =>
      import('./GeneraGraficasSaneamientos/GeneraGraficasSaneamientos').then(
        m => m.GeneraGraficaSaneamientos
      )
  },
  {
    path: '**',
    redirectTo: 'graficas-saneamientos'
  }
];
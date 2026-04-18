import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';


import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers:
   [
    provideRouter(
      routes,
      withHashLocation(),   
      withComponentInputBinding()
    ),      
      provideClientHydration(),
      provideHttpClient(withFetch(),
      withInterceptorsFromDi()),
      provideAnimationsAsync(),
      importProvidersFrom(ToastModule),
      MessageService
   ]
};
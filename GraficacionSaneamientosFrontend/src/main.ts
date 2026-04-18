// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations'; // para PrimeNG

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    MessageService,    
    provideAnimations(),  
  ],
}).catch(err => console.error(err));

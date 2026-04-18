// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const auth = inject(AuthService);
  const isBrowser = isPlatformBrowser(platformId);

  if (!isBrowser) return true;

  const ok = auth.isLoggedInSnapshot(); 
  if (!ok) router.navigateByUrl('/login');
  return ok;
};

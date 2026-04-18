import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private loginSvc = inject(LoginService);
  private auth = inject(AuthService);

  loading = false;
  showPass = false;
  errorMsg = '';

  form = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    pass: ['', [Validators.required, Validators.minLength(3)]],
  });

  get f() { return this.form.controls; }

  submit() {
    this.errorMsg = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { userName, pass } = this.form.getRawValue()!;
    this.loading = true;

    this.loginSvc.validaLogin(userName!, pass!)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (resp) => {
          const payload = resp?.data;
          const userId  = payload?.id;
          const role    = (payload?.role || '').toUpperCase();

          if (!userId || !role) {
            this.errorMsg = 'Respuesta inválida del servidor.';
            return;
          }

          this.auth.markLoggedIn(String(userId), userName!, role as any);

          this.router.navigateByUrl('/');
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'No se pudo validar el acceso.';
          console.error('Login error:', err);
        }
      });
  }

  toggleShowPass() {
    this.showPass = !this.showPass;
  }
}

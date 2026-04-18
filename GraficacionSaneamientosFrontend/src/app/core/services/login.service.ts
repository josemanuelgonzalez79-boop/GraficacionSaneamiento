import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { enviroment } from '../../../enviroments/enviroment';
import { map, Observable } from 'rxjs';
import { ApiResponseDTO } from '../../interfaces/ApiResponse';
import { HttpParams } from '@angular/common/http';


export type Role = 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR';

export interface LoginResponse {
  data: { id: number; role: Role; userName: string };
}

export interface Usuario {
  id: number;
  username: string;
  role: Role;
}

interface UsuariosResponse {
  data: Array<{ id: number; userName: string; role: Role }>;
}

@Injectable({ providedIn: 'root' })

export class LoginService {
  
  private base = `${enviroment.apiUrl}/api/v1/recetPrebatch/`;
  
  constructor(private http: HttpClient) {}

  validaLogin(userName: string, pass: string) {
    return this.http.post<LoginResponse>(
      `${this.base}validateLogin`,
      { userName, pass }
    );
  }

  consultaUsuarios() {
    const url = `${this.base}consultationUsers`;
    return this.http.get<UsuariosResponse>(url).pipe(
      map(resp =>
        (resp?.data ?? []).map(u => ({
          id: u.id,
          username: u.userName,
          role: u.role,
        }))
      )
    );
  }

  nuevoUsuario(username: string, pass: string, role: string): Observable<ApiResponseDTO>{

    const nuevoUsuarioUrl = `${this.base}newUser`;

    return this.http.post<ApiResponseDTO>(nuevoUsuarioUrl,{username,pass,role});
  }

  eliminarUsuario(id: number): Observable<ApiResponseDTO> {

    const eliminarUsuarioUrl = `${this.base}deleteUser?id=${id}`;

    return this.http.post<ApiResponseDTO>(eliminarUsuarioUrl,{});
  }

  actualizarUsuario(username: string, pass: string | null, role: string, id: number) {
    const url = `${this.base}updateUser`;
    let params = new HttpParams()
      .set('username', username)
      .set('role', role)
      .set('id', String(id));

    if (pass && pass.trim().length >= 6) {
      params = params.set('pass', pass.trim());
    }
    return this.http.post<ApiResponseDTO>(url, {}, { params });
  }

}
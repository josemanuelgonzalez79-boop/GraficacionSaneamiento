import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseDTO } from '../../interfaces/ApiResponse';
import { enviroment } from '../../../enviroments/enviroment';

export interface Componentes {
  id: string;
  componentes: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ComponentsService {
  private apiUrl = `${enviroment.apiUrl}/api/v1/components`;

  constructor(private http: HttpClient) {}

  obtenerComponentes(): Observable<ApiResponseDTO> {
    return this.http.get<ApiResponseDTO>(`${this.apiUrl}`);
  }

  obtenerComponentesCompleto(id: string): Observable<ApiResponseDTO> {
    return this.http.get<ApiResponseDTO>(`${this.apiUrl}/${id}`);
  }

  validaBtnEliminar(id: string): Observable<ApiResponseDTO> {
    return this.http.get<ApiResponseDTO>(`${this.apiUrl}/${id}/validate-delete`);
  }

  eliminar(id: string): Observable<ApiResponseDTO> {
    return this.http.delete<ApiResponseDTO>(`${this.apiUrl}/${id}`);
  }

  validaNoObsoleto(id: string): Observable<ApiResponseDTO> {
    return this.http.get<ApiResponseDTO>(`${this.apiUrl}/${id}/validate-not-obsolete`);
  }

  validaObsoleto(id: string): Observable<ApiResponseDTO> {
    return this.http.get<ApiResponseDTO>(`${this.apiUrl}/${id}/validate-obsolete`);
  }

  creaComponente(id: string, name: string, recipeReference: string, type: string): Observable<ApiResponseDTO> {
    return this.http.post<ApiResponseDTO>(`${this.apiUrl}`, { id, name, recipeReference, type });
  }

  actualizaComponente(id: string): Observable<ApiResponseDTO> {
    return this.http.put<ApiResponseDTO>(`${this.apiUrl}/${id}`, {});
  }

  guardaComponente(componente: any): Observable<ApiResponseDTO> {
    return this.http.post<ApiResponseDTO>(`${this.apiUrl}/guardar`, componente);
  }

  actualizaGuardadoComponente(id: string): Observable<ApiResponseDTO> {
    return this.http.put<ApiResponseDTO>(`${this.apiUrl}/${id}/guardar`, {});
  }
}

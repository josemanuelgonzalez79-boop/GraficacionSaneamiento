import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseDTO } from '../interfaces/ApiResponse';
import { enviroment } from '../../enviroments/enviroment'

@Injectable({
  providedIn: 'root'
})

export class GraficasService {

    private graficasUrl = `${enviroment.apiUrl}/api/v1/sanitationGraphics/`;

    constructor(private http: HttpClient) {}

    SanitationReport(id: number): Observable<ApiResponseDTO> {

        const constGraficasUrl = `${this.graficasUrl}sanitationReport`;

        return this.http.post<ApiResponseDTO>(constGraficasUrl, {id});
    }

    SanitationProcesses(
        startDate: string,
        endDate: string,
        station?: number,
        objectName?: string,
        recipeName?: string
    ): Observable<ApiResponseDTO> {

        const constGraficasUrl = `${this.graficasUrl}sanitationProcesses`;

        return this.http.post<ApiResponseDTO>(constGraficasUrl, {startDate,endDate,station,objectName,recipeName});
    }

    GetRecipes(): Observable<ApiResponseDTO> {

        const constGraficasUrl = `${this.graficasUrl}recipes`;

        return this.http.get<ApiResponseDTO>(constGraficasUrl);
    }

    GetObjects(): Observable<ApiResponseDTO> {

        const constGraficasUrl = `${this.graficasUrl}objects`;

        return this.http.get<ApiResponseDTO>(constGraficasUrl);
    }
}
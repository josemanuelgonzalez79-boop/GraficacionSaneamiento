package com.icap.services;

import com.icap.dto.ApiResponseDTO;
import com.icap.dto.SanitationProcessFilterDTO;

import jakarta.servlet.http.HttpServletResponse;

public interface GraficasSaneamientosService {
    
    ApiResponseDTO obtenerReporteCompleto(Integer processId, HttpServletResponse response);
    ApiResponseDTO obtenerProcesos(SanitationProcessFilterDTO filter, HttpServletResponse response);
    ApiResponseDTO obtenerRecetas(HttpServletResponse response);
    ApiResponseDTO obtenerObjetos(HttpServletResponse response);

}
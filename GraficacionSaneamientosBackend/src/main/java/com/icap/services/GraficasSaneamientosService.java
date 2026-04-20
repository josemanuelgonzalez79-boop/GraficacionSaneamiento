package com.icap.services;

import com.icap.dto.ActualizaCompExistenteDTO;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.CreaComponenteDTO;
import com.icap.dto.DeleteComponentDTO;
import com.icap.dto.FullComponentsDTO;
import com.icap.dto.ObtenerPasosDTO;

import jakarta.servlet.http.HttpServletResponse;

public interface GraficasSaneamientosService {
    
    ApiResponseDTO getFullComponents(FullComponentsDTO data, HttpServletResponse response);
    ApiResponseDTO obtenerPasos(ObtenerPasosDTO data, HttpServletResponse response);
    ApiResponseDTO obtenerDatosCrudos(ObtenerPasosDTO data, HttpServletResponse response);
    ApiResponseDTO deleteComponent(DeleteComponentDTO data, HttpServletResponse response);
    ApiResponseDTO creaComponente(CreaComponenteDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaComponenteExistente(ActualizaCompExistenteDTO data, HttpServletResponse response);


}
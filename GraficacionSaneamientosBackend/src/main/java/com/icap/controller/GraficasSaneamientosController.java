package com.icap.controller;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.icap.dto.ActualizaCompExistenteDTO;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.CreaComponenteDTO;
import com.icap.dto.DeleteComponentDTO;
import com.icap.dto.FullComponentsDTO;
import com.icap.dto.ObtenerPasosDTO;
import com.icap.services.GraficasSaneamientosService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/sanitationGraphics")
@RequiredArgsConstructor
public class GraficasSaneamientosController {
        private final GraficasSaneamientosService graficasSaneamientosService;
        private final ObjectMapper mapper;

    @PostMapping("getFullComponent")
    public ApiResponseDTO getFullComponent(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        FullComponentsDTO data = mapper.readValue(json, FullComponentsDTO.class);        
        return graficasSaneamientosService.getFullComponents(data,response);
    }

    @PostMapping("getSteps")
    public ApiResponseDTO getSteps(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ObtenerPasosDTO data = mapper.readValue(json, ObtenerPasosDTO.class);
        return graficasSaneamientosService.obtenerPasos(data,response);
    }

    @PostMapping("getRawData")
    public ApiResponseDTO getRawData(HttpServletResponse response, HttpServletRequest request) throws IOException {

        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        ObtenerPasosDTO data = mapper.readValue(json, ObtenerPasosDTO.class);

        return graficasSaneamientosService.obtenerDatosCrudos(data,response);
    }

    @PostMapping("deleteComponent")
    public ApiResponseDTO deleteComponent(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        DeleteComponentDTO data = mapper.readValue(json, DeleteComponentDTO.class);
        return graficasSaneamientosService.deleteComponent(data, response);
    }
    
    @PostMapping("createComponent")
    public ApiResponseDTO postMethodName(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        CreaComponenteDTO data = mapper.readValue(json, CreaComponenteDTO.class);
        return graficasSaneamientosService.creaComponente(data, response);
    }
    
    @PostMapping("updateComponentExists")
    public ApiResponseDTO actualizaComponenteExistente(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ActualizaCompExistenteDTO data = mapper.readValue(json, ActualizaCompExistenteDTO.class);
        return graficasSaneamientosService.actualizaComponenteExistente(data, response);
    }

}
package com.icap.controller;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.icap.dto.ApiResponseDTO;
import com.icap.dto.ObtenerPasosDTO;
import com.icap.dto.SanitationProcessFilterDTO;
import com.icap.services.GraficasSaneamientosService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/sanitationGraphics/")
@RequiredArgsConstructor
public class GraficasSaneamientosController {
        private final GraficasSaneamientosService graficasSaneamientosService;
        private final ObjectMapper mapper;

    @PostMapping("sanitationReport")
    public ApiResponseDTO getSanitationReport(@RequestBody ObtenerPasosDTO data, HttpServletResponse response) {

            return graficasSaneamientosService.obtenerReporteCompleto(data.getId(), response);
    }

    @PostMapping("sanitationProcesses")
    public ApiResponseDTO getSanitationProcesses(
            HttpServletResponse response,
            HttpServletRequest request) throws IOException {

        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        SanitationProcessFilterDTO filter =
                mapper.readValue(json, SanitationProcessFilterDTO.class);

        return graficasSaneamientosService.obtenerProcesos(filter,response);
    }

    @GetMapping("recipes")
    public ApiResponseDTO getRecipes(HttpServletResponse response){

        return graficasSaneamientosService.obtenerRecetas(response);
    }

    @GetMapping("objects")
    public ApiResponseDTO getObjects(HttpServletResponse response){

        return graficasSaneamientosService.obtenerObjetos(response);
    }

}
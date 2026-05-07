package com.icap.services.impl;

import org.springframework.stereotype.Service;

import com.icap.dto.ApiResponseDTO;
import com.icap.dto.CabeceraReporteDTO;
import com.icap.dto.ObjectDTO;
import com.icap.dto.PasoProcesoDTO;
import com.icap.dto.RecipeDTO;
import com.icap.dto.RegistroDatoDTO;
import com.icap.dto.SanitationProcessDTO;
import com.icap.dto.SanitationProcessFilterDTO;
import com.icap.dto.SanitationReportDTO;
import com.icap.entities.PasoRawEntity;
import com.icap.entities.RegistroDatoEntity;
import com.icap.repositories.GraficacionSaneamientosRepository;
import com.icap.services.GraficasSaneamientosService;
import com.icap.utils.LogUtil;
import java.util.Comparator;

import jakarta.servlet.http.HttpServletResponse;

import static com.icap.constants.Estado.FALLO;
import static com.icap.constants.Estado.FINALIZA_TRANSACCION;
import static com.icap.constants.Estado.INICIA_TRANSACCION;
import static com.icap.constants.MetaConstanst.META_ERROR;
import static com.icap.constants.MetaConstanst.META_OK;

import java.sql.Timestamp;
import java.time.Duration; 
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GraficasSaneamientosServiceImpl implements GraficasSaneamientosService {

    private final GraficacionSaneamientosRepository saneamientosRepository;
    private final LogUtil log;

    @Override
    public ApiResponseDTO obtenerReporteCompleto(Integer id, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_REPORTE", "");

        try {

            CabeceraReporteDTO header =
                    saneamientosRepository.obtenerCabecera(id);

            if (header == null) {
                throw new RuntimeException("Proceso no encontrado");
            }

            String tabla;

            if (header.getStation() == 1) {
                tabla = "cleaning01_data";
            } else if (header.getStation() == 2) {
                tabla = "cleaning02_data";
            } else {
                throw new RuntimeException("Estación inválida");
            }

            List<PasoRawEntity> pasosRaw =
                    saneamientosRepository.obtenerPasos(id);

            List<RegistroDatoEntity> rawData =
                    saneamientosRepository.obtenerDatosCrudos(id);

            List<RegistroDatoDTO> rawDataDTO = rawData.stream()
                    .map((RegistroDatoEntity d) -> RegistroDatoDTO.builder()
                            .tiempo(d.getTiempo().toLocalDateTime())
                            .spTemp(d.getSpTemp())
                            .returnTemp(d.getReturnTemp())
                            .supplyTemp(d.getSupplyTemp())
                            .spCond(d.getSpCond())
                            .returnCond(d.getReturnCond())
                            .spOzone(d.getSpOzone())
                            .returnOzone(d.getReturnOzone())
                            .spFlow(d.getSpFlow())
                            .supplyFlow(d.getSupplyFlow())
                            .build())
                    .toList();

            Map<Integer, List<Timestamp>> tiemposPorPaso = new HashMap<>();

            for (PasoRawEntity row : pasosRaw) {
                tiemposPorPaso
                        .computeIfAbsent(row.getStep(), k -> new ArrayList<>())
                        .add(row.getUpdateTime());
            }

            Map<Integer, String> descripciones =
                    saneamientosRepository.obtenerDescripciones();

            List<PasoProcesoDTO> steps = new ArrayList<>();

            int pasoSecuencial = 1;

            List<Map.Entry<Integer, List<Timestamp>>> pasosOrdenados =
                    new ArrayList<>(tiemposPorPaso.entrySet());

            pasosOrdenados.sort(Comparator.comparing(entry -> entry.getValue().get(0)));

            for (Map.Entry<Integer, List<Timestamp>> entry : pasosOrdenados) {

                Integer step = entry.getKey();
                List<Timestamp> tiempos = entry.getValue();

                Timestamp inicio = tiempos.get(0);
                Timestamp fin = tiempos.get(tiempos.size() - 1);

                long duracionSegundos = (fin.getTime() - inicio.getTime()) / 1000;

                steps.add(
                        PasoProcesoDTO.builder()
                                .step(pasoSecuencial++)
                                .duracionSegundos(duracionSegundos)
                                .descripcion(
                                        descripciones.getOrDefault(step, "-")
                                )
                                .build()
                );
            }

            SanitationReportDTO report = SanitationReportDTO.builder()
                    .header(header)
                    .steps(steps)
                    .rawData(rawDataDTO)
                    .build();

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_REPORTE", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(report)
                    .build();

        } catch (Exception e) {

            log.grabar(FALLO, "OBTENER_REPORTE", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerProcesos(SanitationProcessFilterDTO filter, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_PROCESOS", "");

        try {

            List<SanitationProcessDTO> procesos =
                    saneamientosRepository.obtenerProcesos(
                            filter.getStartDate(),
                            filter.getEndDate(),
                            filter.getStation(),
                            filter.getObjectName(),
                            filter.getRecipeName()
                    );

            for (SanitationProcessDTO p : procesos) {

                if (p.getStartTime() != null && p.getFinishTime() != null) {

                    Duration d = Duration.between(p.getStartTime(), p.getFinishTime());

                    long h = d.toHours();
                    long m = d.toMinutesPart();
                    long s = d.toSecondsPart();

                    String duration = String.format("%02d:%02d:%02d", h, m, s);

                    p.setDuration(duration);
                } else {
                    p.setDuration("-");
                }
            }

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_PROCESOS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(procesos)
                    .build();

        } catch (Exception e) {

            log.grabar(FALLO, "OBTENER_PROCESOS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerRecetas(HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_RECETAS", "");

        try {

            List<RecipeDTO> recetas =
                    saneamientosRepository.obtenerRecetas();

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_RECETAS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(recetas)
                    .build();

        } catch (Exception e) {

            log.grabar(FALLO, "OBTENER_RECETAS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerObjetos(HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_OBJETOS", "");

        try {

            List<ObjectDTO> objetos =
                    saneamientosRepository.obtenerObjetos();

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_OBJETOS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(objetos)
                    .build();

        } catch (Exception e) {

            log.grabar(FALLO, "OBTENER_OBJETOS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }
}
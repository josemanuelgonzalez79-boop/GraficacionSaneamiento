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
import com.icap.entities.CleaningWatersEntity;

import jakarta.servlet.http.HttpServletResponse;

import static com.icap.constants.Estado.FALLO;
import static com.icap.constants.Estado.FINALIZA_TRANSACCION;
import static com.icap.constants.Estado.INICIA_TRANSACCION;
import static com.icap.constants.MetaConstanst.META_ERROR;
import static com.icap.constants.MetaConstanst.META_OK;

import java.sql.Timestamp;
import java.time.Duration;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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

            CabeceraReporteDTO header = saneamientosRepository.obtenerCabecera(id);

            if (header == null) {
                throw new RuntimeException("Proceso no encontrado");
            }

            // Conservamos la validación de estación de la versión development.
            String tabla;
            if (header.getStation() == 1) {
                tabla = "cleaning01_data";
            } else if (header.getStation() == 2) {
                tabla = "cleaning02_data";
            } else {
                throw new RuntimeException("Estación inválida");
            }

            // obtenerPasos() ya filtra por ID y ordena por update_time ASC.
            List<PasoRawEntity> pasosRaw = saneamientosRepository.obtenerPasos(id);
            List<RegistroDatoEntity> rawData = saneamientosRepository.obtenerDatosCrudos(id);

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

            Map<Integer, String> descripciones = saneamientosRepository.obtenerDescripciones();

            // El registro de cleaning_waters es independiente de los códigos
            // del PLC. Los campos treated_water01..16 son fases fijas del CIP.
            List<CleaningWatersEntity> aguasEncontradas = saneamientosRepository.obtenerAguas(id);
            CleaningWatersEntity aguas = aguasEncontradas.isEmpty() ? null : aguasEncontradas.get(0);

            List<PasoProcesoDTO> steps = new ArrayList<>();
            int pasoSecuencial = 1;

            List<Map.Entry<Integer, List<Timestamp>>> pasosOrdenados =
                    new ArrayList<>(tiemposPorPaso.entrySet());

            pasosOrdenados.sort(Comparator.comparing(entry -> entry.getValue().get(0)));

            for (Map.Entry<Integer, List<Timestamp>> entry : pasosOrdenados) {

                Integer codigoPaso = entry.getKey();
                List<Timestamp> tiempos = entry.getValue();

                // MIN y MAX de update_time para el código de paso, como solicitaste.
                Timestamp inicio = tiempos.get(0);
                Timestamp fin = tiempos.get(tiempos.size() - 1);

                long duracionSegundos = Math.max(0L, (fin.getTime() - inicio.getTime()) / 1000L);
                String descripcion = descripciones.getOrDefault(codigoPaso, "-");

                steps.add(PasoProcesoDTO.builder()
                        .step(pasoSecuencial++)
                        .codigoPaso(codigoPaso)
                        .inicio(inicio.toLocalDateTime())
                        .terminacion(fin.toLocalDateTime())
                        .duracionSegundos(duracionSegundos)
                        .duracionHms(formatearDuracionHms(duracionSegundos))
                        .descripcion(descripcion)
                        .aguaTratada(obtenerAguaTratadaPorDescripcion(aguas, descripcion))
                        .build());
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

    private String formatearDuracionHms(long segundos) {
        long horas = segundos / 3600;
        long minutos = (segundos % 3600) / 60;
        long secs = segundos % 60;
        return String.format(Locale.ROOT, "%d:%02d:%02d", horas, minutos, secs);
    }

    /**
     * IMPORTANTE: los códigos en cleaning_data.step (p.ej. 81) no son
     * necesariamente los sufijos de treated_waterNN ni el índice secuencial.
     * Usamos la descripción de cleaning_steps para la fase de agua.
     * Si falta una equivalencia o no hay registro de aguas, devolvemos null
     * (en la interfaz se muestra N/A, evitando asignaciones erróneas).
     * Equivalencias basadas en el ejemplo de Ejecución de CIP proporcionado.
     */
    private Double obtenerAguaTratadaPorDescripcion(CleaningWatersEntity aguas, String descripcion) {
        if (aguas == null) return null;

        Integer indice = indiceFaseAgua(descripcion);
        if (indice == null) return null;

        return switch (indice) {
            case 1 -> aguas.getTreatedWater01();
            case 2 -> aguas.getTreatedWater02();
            case 3 -> aguas.getTreatedWater03();
            case 4 -> aguas.getTreatedWater04();
            case 5 -> aguas.getTreatedWater05();
            case 6 -> aguas.getTreatedWater06();
            case 7 -> aguas.getTreatedWater07();
            case 8 -> aguas.getTreatedWater08();
            case 9 -> aguas.getTreatedWater09();
            case 10 -> aguas.getTreatedWater10();
            case 11 -> aguas.getTreatedWater11();
            case 12 -> aguas.getTreatedWater12();
            case 13 -> aguas.getTreatedWater13();
            case 14 -> aguas.getTreatedWater14();
            case 15 -> aguas.getTreatedWater15();
            case 16 -> aguas.getTreatedWater16();
            default -> null;
        };
    }

    private Integer indiceFaseAgua(String descripcion) {
        if (descripcion == null || descripcion.isBlank()) return null;

        String fase = Normalizer.normalize(descripcion, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .trim();

        if (fase.contains("PREENJUAGUE") || fase.contains("PRE ENJUAGUE") ||
                fase.contains("ENJUAGUE INICIAL")) return 1;
        if (fase.contains("EMPUJE DE AGUA CON DETERGENTE")) return 2;
        if (fase.contains("VACIADO A DRENAJE")) return 3;
        if (fase.contains("CAMBIO DE AGUA POR DETERGENTE")) return 4;
        if (fase.contains("RECIRCULACION DE DETERGENTE")) return 5;
        if (fase.contains("EMPUJE DE DETERGENTE POR AGUA")) return 6;
        if (fase.contains("VACIADO A TANQUE DE DETERGENTE")) return 7;
        if (fase.contains("CAMBIO DE DETERGENTE POR AGUA")) return 8;
        if (fase.contains("ENJUAGUE DE DETERGENTE")) return 9;
        if (fase.contains("RECIRCULACION DE AGUA CALIENTE")) return 10;
        if (fase.contains("ENFRIAMIENTO")) return 11;
        if (fase.contains("VACIADO EN TANQUE DE SANITIZANTE") ||
                fase.contains("VACIADO A TANQUE DE SANITIZANTE")) return 12;
        if (fase.contains("ENJUAGUE DE CABEZAL")) return 13;
        if (fase.contains("FIN DE CIP")) return 14;

        return null;
    }

    @Override
    public ApiResponseDTO obtenerProcesos(SanitationProcessFilterDTO filter, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_PROCESOS", "");

        try {
            List<SanitationProcessDTO> procesos = saneamientosRepository.obtenerProcesos(
                    filter.getStartDate(), filter.getEndDate(), filter.getStation(),
                    filter.getObjectName(), filter.getRecipeName());

            for (SanitationProcessDTO p : procesos) {
                if (p.getStartTime() != null && p.getFinishTime() != null) {
                    Duration d = Duration.between(p.getStartTime(), p.getFinishTime());
                    long h = d.toHours();
                    long m = d.toMinutesPart();
                    long s = d.toSecondsPart();
                    p.setDuration(String.format("%02d:%02d:%02d", h, m, s));
                } else {
                    p.setDuration("-");
                }
            }

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_PROCESOS", "");
            return ApiResponseDTO.builder().meta(META_OK.getMeta()).data(procesos).build();

        } catch (Exception e) {
            log.grabar(FALLO, "OBTENER_PROCESOS", e.getMessage());
            return ApiResponseDTO.builder().meta(META_ERROR.getMeta()).build();
        }
    }

    @Override
    public ApiResponseDTO obtenerRecetas(HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_RECETAS", "");

        try {
            List<RecipeDTO> recetas = saneamientosRepository.obtenerRecetas();
            log.grabar(FINALIZA_TRANSACCION, "OBTENER_RECETAS", "");
            return ApiResponseDTO.builder().meta(META_OK.getMeta()).data(recetas).build();

        } catch (Exception e) {
            log.grabar(FALLO, "OBTENER_RECETAS", e.getMessage());
            return ApiResponseDTO.builder().meta(META_ERROR.getMeta()).build();
        }
    }

    @Override
    public ApiResponseDTO obtenerObjetos(HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_OBJETOS", "");

        try {
            List<ObjectDTO> objetos = saneamientosRepository.obtenerObjetos();
            log.grabar(FINALIZA_TRANSACCION, "OBTENER_OBJETOS", "");
            return ApiResponseDTO.builder().meta(META_OK.getMeta()).data(objetos).build();

        } catch (Exception e) {
            log.grabar(FALLO, "OBTENER_OBJETOS", e.getMessage());
            return ApiResponseDTO.builder().meta(META_ERROR.getMeta()).build();
        }
    }

    @Override
    public ApiResponseDTO obtenerAguas(Integer id, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_AGUAS", "");

        try {
            List<CleaningWatersEntity> aguas = saneamientosRepository.obtenerAguas(id);
            log.grabar(FINALIZA_TRANSACCION, "OBTENER_AGUAS", "");
            return ApiResponseDTO.builder().meta(META_OK.getMeta()).data(aguas).build();

        } catch (Exception e) {
            log.grabar(FALLO, "OBTENER_AGUAS", e.getMessage());
            return ApiResponseDTO.builder().meta(META_ERROR.getMeta()).build();
        }
    }
}

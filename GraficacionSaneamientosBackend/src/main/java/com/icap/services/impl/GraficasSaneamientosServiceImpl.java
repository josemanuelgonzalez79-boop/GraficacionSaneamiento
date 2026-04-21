package com.icap.services.impl;
import org.springframework.stereotype.Service;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.CabeceraReporteDTO;
import com.icap.dto.ObjectDTO;
import com.icap.dto.RecipeDTO;
import com.icap.dto.SanitationProcessDTO;
import com.icap.dto.SanitationProcessFilterDTO;
import com.icap.dto.SanitationReportDTO;
import com.icap.entities.PasoRawEntity;
import com.icap.entities.RegistroDatoEntity;
import com.icap.repositories.GraficacionSaneamientosRepository;
import com.icap.services.GraficasSaneamientosService;
import com.icap.utils.LogUtil;
import jakarta.servlet.http.HttpServletResponse;
import static com.icap.constants.Estado.FALLO;
import static com.icap.constants.Estado.FINALIZA_TRANSACCION;
import static com.icap.constants.Estado.INICIA_TRANSACCION;
import static com.icap.constants.MetaConstanst.META_ERROR;
import static com.icap.constants.MetaConstanst.META_OK;

import java.util.List;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GraficasSaneamientosServiceImpl implements GraficasSaneamientosService {
    
    private final GraficacionSaneamientosRepository saneamientosRepository;
    private final LogUtil log;

    @Override
    public ApiResponseDTO obtenerReporteCompleto(Integer id, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_REPORTE", "");

        try{

            CabeceraReporteDTO header =
                    saneamientosRepository.obtenerCabecera(id);

            if(header == null){
                throw new RuntimeException("Proceso no encontrado");
            }

            String tabla;

            if(header.getStation() == 1){
                tabla = "cleaning01_data";
            }else if(header.getStation() == 2){
                tabla = "cleaning02_data";
            }else{
                throw new RuntimeException("Estación inválida");
            }

            List<PasoRawEntity> pasosRaw =
                    saneamientosRepository.obtenerPasos(id, tabla);

            List<RegistroDatoEntity> rawData =
                    saneamientosRepository.obtenerDatosCrudos(id, tabla);

            // aquí luego conviertes pasosRaw → PasoProcesoDTO (como ya hicimos antes)

            SanitationReportDTO report = SanitationReportDTO.builder()
                    .header(header)
                    .steps(null)   // aquí pondrás los pasos procesados
                    .rawData(null) // aquí pondrás rawData convertido a DTO
                    .build();

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_REPORTE", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(report)
                    .build();

        }catch(Exception e){

            log.grabar(FALLO, "OBTENER_REPORTE", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerProcesos(SanitationProcessFilterDTO filter, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_PROCESOS", "");

        try{

            List<SanitationProcessDTO> procesos =
                    saneamientosRepository.obtenerProcesos(
                            filter.getStartDate(),
                            filter.getEndDate(),
                            filter.getStation(),
                            filter.getObjectName(),
                            filter.getRecipeName()
                    );

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_PROCESOS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(procesos)
                    .build();

        }catch(Exception e){

            log.grabar(FALLO, "OBTENER_PROCESOS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerRecetas(HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_RECETAS", "");

        try{

            List<RecipeDTO> recetas =
                    saneamientosRepository.obtenerRecetas();

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_RECETAS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(recetas)
                    .build();

        }catch(Exception e){

            log.grabar(FALLO, "OBTENER_RECETAS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerObjetos(HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_OBJETOS", "");

        try{

            List<ObjectDTO> objetos =
                    saneamientosRepository.obtenerObjetos();

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_OBJETOS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(objetos)
                    .build();

        }catch(Exception e){

            log.grabar(FALLO, "OBTENER_OBJETOS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

}
package com.icap.services.impl;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import com.icap.dto.ActualizaCompExistenteDTO;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.CreaComponenteDTO;
import com.icap.dto.DeleteComponentDTO;
import com.icap.dto.FullComponentsDTO;
import com.icap.dto.ObtenerPasosDTO;
import com.icap.dto.PasoProcesoDTO;
import com.icap.entities.ComponentsFullEntity;
import com.icap.entities.PasoRawEntity;
import com.icap.entities.RegistroDatoEntity;
import com.icap.repositories.GraficacionSaneamientosRepository;
import com.icap.services.GraficasSaneamientosService;
import com.icap.utils.LogUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import static com.icap.constants.Estado.FALLO;
import static com.icap.constants.Estado.FINALIZA_TRANSACCION;
import static com.icap.constants.Estado.INICIA_TRANSACCION;
import static com.icap.constants.AppMessages.COMPONENTEEXISTENTE;
import static com.icap.constants.AppMessages.CREACOMPONENTE;
import static com.icap.constants.AppMessages.DELETECOMPONENT;
import static com.icap.constants.AppMessages.OBTAINFULLCOMPONENTS;
import static com.icap.constants.AppMessages.OBTENERPASOS;
import static com.icap.constants.MetaConstanst.META_ERROR;
import static com.icap.constants.MetaConstanst.META_OK;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GraficasSaneamientosServiceImpl implements GraficasSaneamientosService{
    
    private final GraficacionSaneamientosRepository saneamientosRepository;
    private final LogUtil log;

    @Override
    public ApiResponseDTO getFullComponents(FullComponentsDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, OBTAINFULLCOMPONENTS, "");

        try{

            ComponentsFullEntity fullComponent = saneamientosRepository.fullComponentes(data.getId());

            log.grabar(FINALIZA_TRANSACCION, OBTAINFULLCOMPONENTS, "");

            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(fullComponent)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, OBTAINFULLCOMPONENTS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }

    }

    @Override
    public ApiResponseDTO obtenerPasos(ObtenerPasosDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, OBTENERPASOS, "");

        try {

            String tabla;

            if(data.getStation() == 1){
                tabla = "cleaning01_data";
            }else if(data.getStation() == 2){
                tabla = "cleaning02_data";
            }else{
                throw new IllegalArgumentException("Station inválida");
            }

            List<PasoRawEntity> datos =
                    saneamientosRepository.obtenerPasos(data.getId(), tabla);

            Map<Integer,String> descripciones =
                    saneamientosRepository.obtenerDescripciones();

            Map<Integer,List<Timestamp>> tiemposPorPaso = new HashMap<>();

            for(PasoRawEntity row : datos){

                tiemposPorPaso
                        .computeIfAbsent(row.getStep(), k -> new ArrayList<>())
                        .add(row.getUpdateTime());
            }

            List<PasoProcesoDTO> resultado = new ArrayList<>();

            int pasoSecuencial = 1;

            for(Integer step : new TreeSet<>(tiemposPorPaso.keySet())){

                List<Timestamp> tiempos = tiemposPorPaso.get(step);

                long duracion = 0;

                if(tiempos.size() >= 2){

                    Timestamp first = tiempos.get(0);
                    Timestamp last = tiempos.get(tiempos.size()-1);

                    duracion = (last.getTime() - first.getTime()) / 1000;
                }

                String descripcion =
                        descripciones.getOrDefault(step,"Paso desconocido");

                resultado.add(
                        PasoProcesoDTO.builder()
                                .step(pasoSecuencial++)
                                .duracionSegundos(duracion)
                                .descripcion(descripcion)
                                .build()
                );
            }

            log.grabar(FINALIZA_TRANSACCION, OBTENERPASOS, "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(resultado)
                    .build();

        }catch(Exception e){

            log.grabar(FALLO, OBTENERPASOS, e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    public ApiResponseDTO obtenerDatosCrudos(ObtenerPasosDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, "OBTENER_DATOS_CRUDOS", "");

        try {

            String tabla;

            if(data.getStation() == 1){
                tabla = "cleaning01_data";
            }else if(data.getStation() == 2){
                tabla = "cleaning02_data";
            }else{
                throw new IllegalArgumentException("Station inválida");
            }

            List<RegistroDatoEntity> datos =
                    saneamientosRepository.obtenerDatosCrudos(data.getId(), tabla);

            log.grabar(FINALIZA_TRANSACCION, "OBTENER_DATOS_CRUDOS", "");

            return ApiResponseDTO.builder()
                    .meta(META_OK.getMeta())
                    .data(datos)
                    .build();

        }catch(Exception e){

            log.grabar(FALLO, "OBTENER_DATOS_CRUDOS", e.getMessage());

            return ApiResponseDTO.builder()
                    .meta(META_ERROR.getMeta())
                    .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO deleteComponent(DeleteComponentDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, DELETECOMPONENT, "");

        try{

            saneamientosRepository.eliminar(data.getId());

            log.grabar(FINALIZA_TRANSACCION, DELETECOMPONENT, "");

            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, DELETECOMPONENT, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    @Transactional
    public ApiResponseDTO creaComponente(CreaComponenteDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, CREACOMPONENTE, "");

        try{

            saneamientosRepository.createComponent(data.getId(),data.getName(),data.getReference(),data.getType());

            log.grabar(FINALIZA_TRANSACCION, CREACOMPONENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CREACOMPONENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }

    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaComponenteExistente(ActualizaCompExistenteDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, COMPONENTEEXISTENTE, "");

        try{

            saneamientosRepository.actualizaComponenteExistente(data.getId());

            log.grabar(FINALIZA_TRANSACCION, COMPONENTEEXISTENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, COMPONENTEEXISTENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }

    }

}
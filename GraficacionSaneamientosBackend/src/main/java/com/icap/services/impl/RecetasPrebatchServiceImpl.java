package com.icap.services.impl;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import com.icap.dto.ActualizaCompExistenteDTO;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.CreaComponenteDTO;
import com.icap.dto.DeleteComponentDTO;
import com.icap.dto.FullComponentsDTO;
import com.icap.entities.ComponentsFullEntity;
import com.icap.repositories.RecetasPrebatchRepository;
import com.icap.services.RecetasPrebatchService;
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
import static com.icap.constants.MetaConstanst.META_ERROR;
import static com.icap.constants.MetaConstanst.META_OK;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecetasPrebatchServiceImpl implements RecetasPrebatchService{
    
    private final RecetasPrebatchRepository recetasPrebatchRepository;
    private final LogUtil log;

    @Override
    public ApiResponseDTO getFullComponents(FullComponentsDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, OBTAINFULLCOMPONENTS, "");

        try{

            ComponentsFullEntity fullComponent = recetasPrebatchRepository.fullComponentes(data.getId());

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
    @Transactional
    public ApiResponseDTO deleteComponent(DeleteComponentDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, DELETECOMPONENT, "");

        try{

            recetasPrebatchRepository.eliminar(data.getId());

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

            recetasPrebatchRepository.createComponent(data.getId(),data.getName(),data.getReference(),data.getType());

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

            recetasPrebatchRepository.actualizaComponenteExistente(data.getId());

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
package com.icap.exceptions;

import com.icap.dto.ApiResponseDTO;
import com.icap.dto.MetaDTO;
import com.icap.utils.LogUtil;
import com.icap.constants.AppMessages;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import static com.icap.constants.Estado.FALLO;


/**
 * Clase para manejo de excepciones no controladas.
 */
@ControllerAdvice
@RequiredArgsConstructor
public class AppExceptionHandler extends ResponseEntityExceptionHandler {
    private final LogUtil log;
    @ExceptionHandler(value = {ResponseStatusException.class})
    public ResponseEntity<Object> handleResponseStatusException(ResponseStatusException ex) {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        MetaDTO meta = MetaDTO.builder()
            .status(AppMessages.CLIENT_ERROR)
            .statusCode(ex.getStatusCode().value())
            .message(ex.getReason())
            .devMessage(null)
            .build();

        ApiResponseDTO apiResponseDTO = ApiResponseDTO.builder()
            .meta(meta)
            .build();

        log.grabar(FALLO, "AppExceptionHandler", ex.getReason());

        return new ResponseEntity<>(apiResponseDTO, httpHeaders, ex.getStatusCode());
    }
    
    /** 
     * Cualquier excepción que no sea atendida será tratada en en este método.
     * @return ResponseEntity<Object>
     */
    @ExceptionHandler(value = {Exception.class})
    protected ResponseEntity<Object> handleException(RuntimeException runtimeException, WebRequest webRequest) {
        String message = runtimeException.getMessage() == null ? runtimeException.getClass().toString() : runtimeException.getMessage();

        boolean rollback = false;

        HttpStatus httpStatus= HttpStatus.INTERNAL_SERVER_ERROR;

        MetaDTO meta = MetaDTO.builder()
            .status(httpStatus.name())
            .statusCode(httpStatus.value())
            .message(null)
            .devMessage(message)
            .rollback(rollback)
            .build();

        ApiResponseDTO apiResponseDTO = ApiResponseDTO.builder()
            .meta(meta)
            .build();

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        log.grabar(FALLO, "handleException", message);

        return handleExceptionInternal(
            runtimeException,
            apiResponseDTO,
            httpHeaders,
            httpStatus,
            webRequest
        );
    }
    
}

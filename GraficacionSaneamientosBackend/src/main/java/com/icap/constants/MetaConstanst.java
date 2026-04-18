package com.icap.constants;

import com.icap.dto.MetaDTO;

/**
 * MetaConstanst
 */
public enum MetaConstanst
{
    META_OK("OK", 200, ""),
    META_FAIL_AUTH("FAIL AUTH", 401, "Usted no está autorizado para acceder a este recurso"),
    META_ERROR("ERROR", 400, null);

    private final String status;
    private final int statusCode;
    private final String message;

    MetaConstanst(String status, int statusCode, String message) {
        this.status = status;
        this.statusCode = statusCode;
        this.message = message;
    }

    public MetaDTO getMeta() {
        return MetaDTO.builder()
            .status(this.status)
            .statusCode(this.statusCode)
            .build();
    }
}
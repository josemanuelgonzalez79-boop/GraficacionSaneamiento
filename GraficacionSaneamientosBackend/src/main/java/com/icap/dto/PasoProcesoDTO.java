package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PasoProcesoDTO {

    private Integer step;
    private Long duracionSegundos;
    private String descripcion;

}

package com.icap.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PasoProcesoDTO {
    private Integer step;             // 1..n: posición cronológica (barra de etapas)
    private Integer codigoPaso;       // código original de cleaning_data.step (ej.: 81)
    private Long duracionSegundos;
    private String duracionHms;
    private String descripcion;
    private LocalDateTime inicio;     // MIN(update_time) del código de paso
    private LocalDateTime terminacion; // MAX(update_time) del código de paso
    private Double aguaTratada;       // treated_waterNN asociado a la descripción
}

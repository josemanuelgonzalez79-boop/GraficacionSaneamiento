package com.icap.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SanitationReportDTO {
    
    private CabeceraReporteDTO header;
    private List<PasoProcesoDTO> steps;
    private List<RegistroDatoDTO> rawData;

}
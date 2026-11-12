package com.icap.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroDatoDTO {
    private LocalDateTime tiempo;

    private Double spTemp;
    private Double returnTemp;
    private Double supplyTemp;

    private Double spCond;
    private Double returnCond;
    private Double supplyCond;

    private Double spOzone;
    private Double returnOzone;

    private Double spFlow;
    private Double supplyFlow;

    private Double levelTa5001;
    private Double levelTa5002;
    private Double levelTa5003;
    private Double levelTa5004;
}

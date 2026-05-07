package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    private Double spOzone;
    private Double returnOzone;

    private Double spFlow;
    private Double supplyFlow;
}
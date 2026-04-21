package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanitationProcessFilterDTO {

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer station;
    private String objectName;
    private String recipeName;

}
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
public class SanitationProcessDTO {

    private Integer id;
    private Integer station;

    private String objectName;
    private String recipeName;
    private String userName;

    private LocalDateTime startTime;

}
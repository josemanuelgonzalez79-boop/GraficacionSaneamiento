package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreaComponenteDTO {
    
    private String id;
    private String name;
    private String reference;
    private Integer type;

}

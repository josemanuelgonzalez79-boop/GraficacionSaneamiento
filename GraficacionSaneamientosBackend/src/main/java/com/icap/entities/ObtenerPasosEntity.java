package com.icap.entities;
import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ObtenerPasosEntity {
    
    private Integer step;
    private Timestamp updateTime;

}
package com.icap.entities;
import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComponentsFullEntity {
    
    private Integer id;
    private Integer station;
    private String objectName;
    private String recipeName;
    private String userName;
    private Timestamp startTime;
    private Timestamp finishTime;
    private Double waterAccum;
    private Double chemicalAccum;

}
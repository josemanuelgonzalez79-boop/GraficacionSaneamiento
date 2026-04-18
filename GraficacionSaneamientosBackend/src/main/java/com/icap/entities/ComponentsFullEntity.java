package com.icap.entities;

import java.sql.Timestamp;
import java.time.Duration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComponentsFullEntity {
    
    private String id;
    private String name;
    private String recipeReference;
    private Double mass;
    private Double water;
    private Double temp;
    private Boolean obsolete;
    private String comments;
    private Integer type;
    private Timestamp updateTime;
    private Integer version;
    private Boolean bayonet;
    private Boolean hard;
    private Boolean agitationAutomatic;
    private Duration agitationDuration;
    private Boolean circulate;
    private Boolean noInventoryValidation;
    private Boolean liquidsTank;
    private Boolean directWaterLoad;

}
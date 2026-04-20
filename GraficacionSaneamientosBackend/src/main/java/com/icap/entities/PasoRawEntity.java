package com.icap.entities;

import java.sql.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PasoRawEntity {

    private Integer step;
    private Timestamp updateTime;

}

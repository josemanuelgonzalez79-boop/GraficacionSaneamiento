package com.icap.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(Include.NON_DEFAULT)
public class MetaDTO {

    @Builder.Default
    private String timestamp = LocalDateTime.now().toString();

    @Builder.Default
    private String transactionID = UUID.randomUUID().toString();

    private String status;
    private int statusCode;
    private String devMessage;
    private String message;
    private boolean rollback;
}

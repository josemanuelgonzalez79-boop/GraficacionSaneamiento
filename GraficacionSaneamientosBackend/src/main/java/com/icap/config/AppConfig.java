package com.icap.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AppConfig
 */
@Component
@ConfigurationProperties(prefix = "app")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class AppConfig {

    private String authUri;
    private boolean ignoreSession;
    private String allowedOrigins;
    private String allowedMethods = "GET, POST, PUT, DELETE, OPTIONS";
    private String allowedHeaders = "Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Allow-Methods, Accept, "
            + "Authorization, Content-Type, Method, Origin, X-Forwarded-For, X-Real-IP";
}

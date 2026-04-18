package com.icap.filters;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.icap.config.AppConfig;
import com.icap.dto.ApiResponseDTO;
import com.icap.constants.MetaConstanst;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import java.io.IOException;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
* SessionFilter
*/
@Component
@Order(value = 1)
@RequiredArgsConstructor
public class SessionFilter implements Filter {
    
    private final AppConfig config;

    @Override
    public void doFilter(final ServletRequest request, final ServletResponse response, final FilterChain chain) 
    throws IOException, ServletException
    {
        final HttpServletRequest req = (HttpServletRequest) request;
        final String path = req.getRequestURI().substring(req.getContextPath().length());

        if (path.startsWith("/actuator") || config.isIgnoreSession()) {
            chain.doFilter(request, response);
            return;
        }

        final HttpServletResponse res = (HttpServletResponse) response;
        final ApiResponseDTO apiResponseDTO = new ApiResponseDTO();
        final ObjectMapper objectMapper = new ObjectMapper();

        if (req.getHeader(HttpHeaders.AUTHORIZATION) == null)
        {
            resError(res, apiResponseDTO, objectMapper);
            return;
        }

        final RestTemplate client = new RestTemplate();
        final HttpHeaders authHeaders = new HttpHeaders();

        authHeaders.add(HttpHeaders.AUTHORIZATION, req.getHeader(HttpHeaders.AUTHORIZATION));

        final HttpEntity<String> httpEntity = new HttpEntity<>(authHeaders);

        try
        {
            final ResponseEntity<String> authResponse = client.exchange(config.getAuthUri(), HttpMethod.GET, httpEntity, String.class);

            if (authResponse.getStatusCode() == HttpStatus.OK)
            {
                chain.doFilter(request, response);
            }
        }
        catch (RestClientException ex)
        {
            resError(res, apiResponseDTO, objectMapper);
        }
    }

    private void resError(HttpServletResponse res, ApiResponseDTO apiResponseDTO, ObjectMapper objectMapper)
    throws IOException
    {
        res.reset();

        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        res.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, config.getAllowedOrigins());
        res.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, config.getAllowedMethods());
        res.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, config.getAllowedHeaders());
        res.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        res.setCharacterEncoding("UTF-8");

        apiResponseDTO.setMeta(MetaConstanst.META_FAIL_AUTH.getMeta());

        res.getWriter().write(objectMapper.writeValueAsString(apiResponseDTO));
    }
}

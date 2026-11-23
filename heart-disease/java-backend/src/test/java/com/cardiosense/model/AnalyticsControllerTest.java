package com.cardiosense.model;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cardiosense.auth.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AnalyticsController.class)
@Import(SecurityConfig.class)
class AnalyticsControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoBean ModelServiceClient model;

    @Test
    void returnsDatasetShapeAndRejectsMissingInputs() throws Exception {
        when(model.datasets()).thenReturn(mapper.readTree("{\"datasets\":[]}"));
        mvc.perform(get("/api/analytics/datasets")).andExpect(status().isOk())
                .andExpect(jsonPath("$.datasets").isArray());
        mvc.perform(post("/api/analytics/population-benchmark").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"age\":55}"))
                .andExpect(status().isUnprocessableEntity());
        verify(model, never()).benchmark(any());
    }
}

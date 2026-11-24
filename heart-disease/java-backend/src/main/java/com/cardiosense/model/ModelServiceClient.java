package com.cardiosense.model;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ModelServiceClient {
    private final RestClient client;

    public ModelServiceClient(RestClient modelRestClient) {
        this.client = modelRestClient;
    }

    public JsonNode datasets() {
        try {
            return requireArray(client.get().uri("/api/analytics/datasets").retrieve().body(JsonNode.class),
                    "datasets");
        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Model service unavailable", ex);
        } catch (RestClientResponseException ex) {
            throw downstreamError(ex);
        }
    }

    public JsonNode benchmark(AnalyticsController.Features features) {
        try {
            return requireArray(client.post().uri("/api/analytics/population-benchmark")
                    .body(features).retrieve().body(JsonNode.class), "feature_percentiles");
        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Model service unavailable", ex);
        } catch (RestClientResponseException ex) {
            throw downstreamError(ex);
        }
    }

    private JsonNode requireArray(JsonNode result, String field) {
        if (result == null || !result.isObject() || !result.path(field).isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid model service response");
        }
        return result;
    }

    private ResponseStatusException downstreamError(RestClientResponseException ex) {
        HttpStatus status = ex.getStatusCode().value() == 503
                ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY;
        return new ResponseStatusException(status, "Model service request failed", ex);
    }
}

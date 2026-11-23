package com.cardiosense.model;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
class ModelClientConfig {
    @Bean
    RestClient modelRestClient(RestClient.Builder builder,
                               @Value("${cardiosense.model-service.url}") String url) {
        URI uri = URI.create(url);
        if (!"http".equals(uri.getScheme()) || uri.getHost() == null
                || !Set.of("localhost", "127.0.0.1", "::1", "[::1]").contains(uri.getHost().toLowerCase(Locale.ROOT))
                || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null
                || (uri.getPath() != null && !uri.getPath().isEmpty() && !"/".equals(uri.getPath()))) {
            throw new IllegalArgumentException("MODEL_SERVICE_URL must be a local HTTP origin");
        }
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(60));
        return builder.baseUrl(uri.toString()).requestFactory(factory).build();
    }
}

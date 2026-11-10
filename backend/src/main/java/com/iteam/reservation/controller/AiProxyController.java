package com.iteam.reservation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiProxyController {

    @Value("${ai.service.url:http://ai-service:5000}")
    private String aiServiceUrl;

    private WebClient getClient() {
        return WebClient.builder().baseUrl(aiServiceUrl).build();
    }

    @PostMapping("/recommend")
    public ResponseEntity<Object> recommend(@RequestBody Map<String, Object> body) {
        try {
            Object result = getClient().post()
                .uri("/api/recommend")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Object.class)
                .block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI recommend failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("recommendations", java.util.List.of(),
                "error", "Service IA temporairement indisponible"));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<Object> chat(@RequestBody Map<String, Object> body) {
        try {
            Object result = getClient().post()
                .uri("/api/chat")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Object.class)
                .block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "response", "Je suis temporairement indisponible. Veuillez réessayer plus tard.",
                "intent", "error",
                "suggestions", java.util.List.of("Réessayer", "Aide")
            ));
        }
    }

    @GetMapping("/predict")
    public ResponseEntity<Object> predict(@RequestParam(required = false) Long roomId,
                                           @RequestParam(defaultValue = "4") int weeks) {
        try {
            String uri = "/api/predict?weeks=" + weeks + (roomId != null ? "&roomId=" + roomId : "");
            Object result = getClient().get().uri(uri).retrieve().bodyToMono(Object.class).block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI predict failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("weeklyPredictions", java.util.List.of()));
        }
    }

    @GetMapping("/anomalies")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Object> getAnomalies() {
        try {
            Object result = getClient().get().uri("/api/anomalies").retrieve().bodyToMono(Object.class).block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI anomalies failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("anomalies", java.util.List.of(), "total", 0));
        }
    }
}

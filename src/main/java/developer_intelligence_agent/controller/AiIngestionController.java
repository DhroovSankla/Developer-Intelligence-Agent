package developer_intelligence_agent.controller;

import developer_intelligence_agent.dto.ProfileIngestionRequest;
import developer_intelligence_agent.service.AiIngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/ai")
public class AiIngestionController {

    private final AiIngestionService aiIngestionService;

    public AiIngestionController(AiIngestionService aiIngestionService) {
        this.aiIngestionService = aiIngestionService;
    }

    // 1. Ingestion Endpoint -> maps to /api/ai/ingest/developer
    @PostMapping("/ingest/developer")
    public ResponseEntity<String> ingestDeveloper(@RequestBody ProfileIngestionRequest request) {
        aiIngestionService.ingestDeveloperProfile(request);
        return ResponseEntity.ok("Developer profile tokenized and indexed into PgVector successfully!");
    }

    // 2. Dynamic Fetch Endpoint -> maps exactly to /api/ai/profiles
    @GetMapping("/profiles")
    public ResponseEntity<?> getAllProfiles() {
        try {
            // Reaches into the database directly to verify records without serialization locks
            return ResponseEntity.ok(aiIngestionService.getAllIndexedProfiles());
        } catch (Exception e) {
            // If anything breaks during mapping, catch it here and return a valid empty JSON array
            // instead of letting Tomcat drop the socket connection!
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
}
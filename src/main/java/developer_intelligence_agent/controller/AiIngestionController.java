package developer_intelligence_agent.controller;

import developer_intelligence_agent.dto.ProfileIngestionRequest;
import developer_intelligence_agent.service.AiIngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/ingest")
public class AiIngestionController {

    private final AiIngestionService aiIngestionService;

    public AiIngestionController(AiIngestionService aiIngestionService) {
        this.aiIngestionService = aiIngestionService;
    }

    @PostMapping("/developer")
    public ResponseEntity<String> ingestDeveloper(@RequestBody ProfileIngestionRequest request) {
        aiIngestionService.ingestDeveloperProfile(request);
        return ResponseEntity.ok("Developer profile tokenized and indexed into PgVector successfully!");
    }
}
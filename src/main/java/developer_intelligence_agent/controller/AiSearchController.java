package developer_intelligence_agent.controller;

import developer_intelligence_agent.service.AiSearchService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/ai/search")
public class AiSearchController {

    private final AiSearchService aiSearchService;

    public AiSearchController(AiSearchService aiSearchService) {
        this.aiSearchService = aiSearchService;
    }

    @GetMapping("/query")
    public String semanticSearchAndAnalyze(@RequestParam(value = "query") String query) {
        return aiSearchService.searchAndAnalyze(query);
    }
}
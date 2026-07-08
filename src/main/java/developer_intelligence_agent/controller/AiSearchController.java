package developer_intelligence_agent.controller;

import developer_intelligence_agent.service.AiSearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
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
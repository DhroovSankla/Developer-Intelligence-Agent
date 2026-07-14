package developer_intelligence_agent.controller;

import developer_intelligence_agent.service.AiSearchService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/ai/search")
public class AiSearchController {

    private final AiSearchService aiSearchService;

    private final org.springframework.ai.chat.client.ChatClient chatClient;

    public AiSearchController(AiSearchService aiSearchService, org.springframework.ai.chat.client.ChatClient.Builder chatClientBuilder) {
        this.aiSearchService = aiSearchService;
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("/query")
    public String semanticSearchAndAnalyze(@RequestParam(value = "query") String query) {
        return aiSearchService.searchAndAnalyze(query);
    }

    @GetMapping("/interview-guide")
    public String generateInterviewGuide(
            @RequestParam String name,
            @RequestParam String skills,
            @RequestParam String query) {
        String prompt = String.format("""
            You are an expert technical interviewer. Generate 5 customized technical interview questions to ask candidate %s.
            Candidate Skills: %s
            Target Position/Query: %s
            
            Provide the questions along with a brief tip for what answer the interviewer should look for. Keep it concise and clean.
            """, name, skills, query);
        return chatClient.prompt().user(prompt).call().content();
    }
}
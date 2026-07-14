package developer_intelligence_agent.service;

import developer_intelligence_agent.model.DeveloperProfile;
import developer_intelligence_agent.repository.DeveloperProfileRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiSearchService {

    private final VectorStore vectorStore;
    private final DeveloperProfileRepository profileRepository;
    private final ChatClient chatClient;

    // Spring AI will automatically inject the VectorStore, your JPA repository, and the ChatClient Builder
    public AiSearchService(VectorStore vectorStore, DeveloperProfileRepository profileRepository, ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.profileRepository = profileRepository;
        this.chatClient = chatClientBuilder.build();
    }

    public String searchAndAnalyze(String searchQuery) {
        // 1. Semantic Vector Search using PgVector
        List<Document> vectorResults = vectorStore.similaritySearch(
                SearchRequest.query(searchQuery).withTopK(3)
        );

        StringBuilder resultBuilder = new StringBuilder();

        for (Document doc : vectorResults) {
            String devName = doc.getMetadata() != null ? doc.getMetadata().getOrDefault("developerName", "Anonymous").toString() : "Anonymous";
            String devId = doc.getMetadata() != null ? doc.getMetadata().getOrDefault("profileId", "UNKNOWN").toString() : "UNKNOWN";
            String skills = doc.getContent();

            String prompt = String.format("""
                You are an expert technical recruiter. Evaluate if the candidate matches the recruitment query.
                
                Candidate Name: %s (ID: %s)
                Candidate Skills: %s
                Recruitment Query: %s
                
                Format your response EXACTLY as:
                - Candidate: %s (ID: %s)
                - Match? [Yes or No] (Explanation: [1-sentence explanation of why their skills match or do not match the query])
                """, devName, devId, skills, searchQuery, devName, devId);

            String evaluation = chatClient.prompt().user(prompt).call().content();
            resultBuilder.append(evaluation.trim()).append("\n\n");
        }

        return resultBuilder.toString();
    }
}
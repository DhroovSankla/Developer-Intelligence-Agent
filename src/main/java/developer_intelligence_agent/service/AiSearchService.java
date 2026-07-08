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
        // 1. Relational SQL Keyword Search using your JPA repository
        List<DeveloperProfile> keywordResults = profileRepository.searchByKeyword(searchQuery);
        String keywordContext = keywordResults.stream()
                .map(p -> String.format("Developer: %s (ID: %s)\nSkills: %s", p.getDeveloperName(), p.getProfileId(), p.getSkillsContent()))
                .collect(Collectors.joining("\n---\n"));

        // 2. Semantic Vector Search using PgVector
        List<Document> vectorResults = vectorStore.similaritySearch(
                SearchRequest.query(searchQuery).withTopK(3)
        );
        String vectorContext = vectorResults.stream()
                .map(Document::getContent)
                .collect(Collectors.joining("\n---\n"));

        // 3. Blend both context tracks into a single context prompt block
        String blendedContext = "--- KEYWORD MATCHES ---\n" + keywordContext +
                "\n\n--- SEMANTIC MATCHES ---\n" + vectorContext;

        // 4. Send the blended context directly to Qwen for analysis
        return chatClient.prompt()
                .user(u -> u.text("""
                    You are an expert technical recruiter analyzer. Use the blended context below to answer the query.
                    
                    Blended Context:
                    {context}
                    
                    User Query: {query}
                    """)
                        .param("context", blendedContext)
                        .param("query", searchQuery))
                .call()
                .content();
    }
}
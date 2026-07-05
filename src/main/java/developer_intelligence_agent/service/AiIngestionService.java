package developer_intelligence_agent.service;

import developer_intelligence_agent.dto.ProfileIngestionRequest;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiIngestionService {

    private final VectorStore vectorStore;

    public AiIngestionService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public void ingestDeveloperProfile(ProfileIngestionRequest request) {
        // 1. Prepare and enrich the structural metadata map
        Map<String, Object> enrichedMetadata = new HashMap<>();
        if (request.metadata() != null) {
            enrichedMetadata.putAll(request.metadata());
        }
        enrichedMetadata.put("profileId", request.profileId());
        enrichedMetadata.put("developerName", request.developerName());

        // 2. Wrap text into a formal Spring AI Document segment
        Document profileDocument = new Document(
                request.skillsContent(),
                enrichedMetadata
        );

        // 3. Send to Vector Store. Spring AI implicitly invokes the embedding model,
        // generates the vectors, and stores it directly into PgVector.
        vectorStore.accept(List.of(profileDocument));
    }
}

package developer_intelligence_agent.service;

import developer_intelligence_agent.dto.ProfileIngestionRequest;
import developer_intelligence_agent.model.DeveloperProfile;
import developer_intelligence_agent.repository.DeveloperProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AiIngestionService {

    private final VectorStore vectorStore;
    private final DeveloperProfileRepository repository;

    public AiIngestionService(VectorStore vectorStore, DeveloperProfileRepository repository) {
        this.vectorStore = vectorStore;
        this.repository = repository;
    }

    public void ingestDeveloperProfile(ProfileIngestionRequest request) {
        DeveloperProfile profile = new DeveloperProfile();
        profile.setProfileId(request.profileId());
        profile.setDeveloperName(request.developerName());
        profile.setSkillsContent(request.skillsContent());

        // Safely extract role and focus strings from your record map metadata block
        if (request.metadata() != null) {
            profile.setRole(request.metadata().getOrDefault("role", "Developer").toString());
            profile.setFocus(request.metadata().getOrDefault("focus", "General").toString());
        } else {
            profile.setRole("Developer");
            profile.setFocus("General");
        }

        repository.saveAndFlush(profile);

        // 2. Prepare and enrich the structural metadata map for the vector engine
        Map<String, Object> enrichedMetadata = new HashMap<>();
        if (request.metadata() != null) {
            enrichedMetadata.putAll(request.metadata());
        }
        enrichedMetadata.put("profileId", request.profileId());
        enrichedMetadata.put("developerName", request.developerName());

        // 3. Wrap text into a formal Spring AI Document segment
        Document profileDocument = new Document(
                request.skillsContent(),
                enrichedMetadata
        );

        // 4. Send downstream to PgVector Store
        vectorStore.accept(List.of(profileDocument));
    }

    public List<ProfileIngestionRequest> getAllIndexedProfiles() {
        try {
            return repository.findAll().stream().map(profile -> {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("role", profile.getRole() != null ? profile.getRole() : "Developer");
                metadata.put("focus", profile.getFocus() != null ? profile.getFocus() : "General");

                return new ProfileIngestionRequest(
                        profile.getProfileId() != null ? profile.getProfileId() : "UNKNOWN",
                        profile.getDeveloperName() != null ? profile.getDeveloperName() : "Anonymous",
                        profile.getSkillsContent() != null ? profile.getSkillsContent() : "",
                        metadata
                );
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("DB_FETCH_ERROR: " + e.getMessage());
            return java.util.Collections.emptyList();
        }
    }
}
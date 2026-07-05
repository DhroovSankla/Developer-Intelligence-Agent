package developer_intelligence_agent.dto;

import java.util.Map;

public record ProfileIngestionRequest(
        String profileId,
        String developerName,
        String skillsContent,
        Map<String, Object> metadata
) {}

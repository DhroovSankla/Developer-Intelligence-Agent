export interface DeveloperProfile {
  profileId: string;
  developerName: string;
  skillsContent: string;
  metadata: {
    role: string;
    focus: string;
  };
}

export interface SearchResponse {
  analysis: string;
  matchedProfiles: DeveloperProfile[];
  searchMetrics?: {
    executionTimeMs: number;
    vectorStoreHits: number;
    keywordHits: number;
  };
}
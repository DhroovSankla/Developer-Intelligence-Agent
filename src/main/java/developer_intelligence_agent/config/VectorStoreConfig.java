package developer_intelligence_agent.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.PgVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return new PgVectorStore.builder()
                .jdbcTemplate(jdbcTemplate)
                .embeddingModel(embeddingModel)
                .dimensions(1536) // OpenAI default text-embedding-ada-002 dimensions
                .distanceType(PgVectorStore.PgDistanceType.COSINE)
                .initializeSchema(true) // Automatically creates the vector table structures on startup
                .build();
    }
}
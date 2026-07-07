package developer_intelligence_agent.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai/search")
public class AiSearchController {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    // Injecting ChatClient.Builder is the idiomatic Spring AI pattern to handle LLM communication
    public AiSearchController(VectorStore vectorStore, ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("/query")
    public String semanticSearchAndAnalyze(@RequestParam(value = "query") String query) {
        // 1. Query the PgVector Store for the top 3 closest developer profiles matching the idea context
        List<Document> similarDocuments = vectorStore.similaritySearch(
                SearchRequest.defaults()
                        .withQuery(query)
                        .withTopK(3)
        );

        // 2. Extract and concatenate the raw skills text from the matching documents
        String databaseContext = similarDocuments.stream()
                .map(Document::getContent)
                .collect(Collectors.joining("\n\n"));

        // 3. Formulate the RAG prompt and stream the response from OpenAI
        return chatClient.prompt()
                .user(userSpec -> userSpec
                        .text("""
                          You are an elite Tech Recruiter and Technical Evaluator Agent.
                          Analyze the following developer profile contexts pulled from our database:
                          
                          [DATABASE CONTEXT]
                          {context}
                          
                          Based ONLY on the context provided above, answer the user's inquiry with a sharp, professional candidate assessment.
                          
                          User Inquiry: {userInput}
                          """)
                        .param("context", databaseContext)
                        .param("userInput", query)
                )
                .call()
                .content();
    }
}
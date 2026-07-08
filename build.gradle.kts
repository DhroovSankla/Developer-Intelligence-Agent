plugins {
	java
	id("org.springframework.boot") version "3.3.2"
	id("io.spring.dependency-management") version "1.1.5"
}

group = "com.dev-intelligence"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
    // Essential repository for resolving Spring AI dependencies
    maven { url = uri("https://repo.spring.io/milestone") }
}

dependencyManagement {
    imports {
        // Utilizing the rock-solid milestone train version of Spring AI
        mavenBom("org.springframework.ai:spring-ai-bom:1.0.0-M1")
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Core Spring AI Orchestration & Vector Modules
    implementation("org.springframework.ai:spring-ai-ollama-spring-boot-starter")
    implementation("org.springframework.ai:spring-ai-pgvector-store-spring-boot-starter")

    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.postgresql:postgresql")

    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

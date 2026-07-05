# ==========================================
# STAGE 1: Build Environment Container
# ==========================================
FROM gradle:8.8-jdk21 AS builder
WORKDIR /app

# Copy the build setup configuration frameworks
COPY gradle /app/gradle
COPY gradlew build.gradle.kts settings.gradle.kts /app/

# Cache dependencies to optimize subsequent build executions
RUN ./gradlew dependencies --no-daemon

# Copy source domains and compile the release asset
COPY src /app/src
RUN ./gradlew bootJar --no-daemon -x test

# ==========================================
# STAGE 2: Ultra-Lightweight Runtime Engine
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /runtime

# Establish non-root process privileges for system fortification
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the lightweight executable jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
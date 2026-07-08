# ==========================================
# STAGE 1: Build Environment Container
# ==========================================
FROM gradle:8.8-jdk21 AS builder
WORKDIR /app

# Copy the build definitions directly
COPY build.gradle.kts settings.gradle.kts /app/

# Use the image's pre-installed global 'gradle' instead of './gradlew'
RUN gradle dependencies --no-daemon

# Copy source domains and compile the release asset
COPY src /app/src
RUN gradle bootJar --no-daemon -x test

# ==========================================
# STAGE 2: Ultra-Lightweight Runtime Engine
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the compiled jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
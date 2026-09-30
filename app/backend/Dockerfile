# syntax=docker/dockerfile:1
# Build stage: compile and package the jar (tests run in CI, not here).
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -Dmaven.test.skip=true package

# Run stage: a small JRE image, running as an unprivileged user.
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 1001 --no-create-home app
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER app
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

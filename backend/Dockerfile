FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S reservation && adduser -S reservation -G reservation
USER reservation

COPY --from=build /app/target/reservation-app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Xmx512m", "-Dspring.profiles.active=prod", "app.jar"]

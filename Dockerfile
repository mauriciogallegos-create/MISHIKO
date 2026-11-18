# Multi-stage build for Java 21 Spring Boot + Frontend
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copiar todo el repositorio (backend + frontend)
COPY . .

# Compilar empaquetando el backend y frontend en un solo JAR
RUN cd backend && mvn clean package -DskipTests

# Imagen ligera de ejecución
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado
COPY --from=build /app/backend/target/*.jar app.jar

# Crear directorios para base de datos H2 persistente y uploads
RUN mkdir -p /app/data /app/uploads

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

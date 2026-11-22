# ========================================================
# ETAPA 1: Compilación del Backend (Java 21 + Spring Boot + Maven)
# Empaqueta automáticamente el frontend precompilado en el JAR
# ========================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copiar el repositorio completo (backend con pom.xml + frontend listo)
COPY . .

# Compilar y empaquetar el JAR único ejecutable
RUN cd backend && mvn clean package -DskipTests

# ========================================================
# ETAPA 2: Imagen Ligera de Ejecución (JRE 21 Alpine)
# ========================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado
COPY --from=builder /app/backend/target/*.jar app.jar

# Crear directorios para persistencia de base de datos H2 y subida de archivos
RUN mkdir -p /app/data /app/uploads

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

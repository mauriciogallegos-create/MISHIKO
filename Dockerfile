# ========================================================
# ETAPA 1: Compilación del Frontend (React + Vite + Tailwind)
# ========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/app_src

# Instalar dependencias de Node
COPY app_src/package*.json ./
RUN npm install

# Compilar el bundle de producción de React
COPY app_src/ ./
RUN npm run build

# ========================================================
# ETAPA 2: Compilación del Backend (Java 21 + Spring Boot + Maven)
# ========================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /app

# Copiar configuración y código fuente de Spring Boot
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src/

# Copiar archivos base de frontend
COPY frontend ./frontend/

# Inyectar el bundle React de producción recién compilado de la Etapa 1
COPY --from=frontend-builder /app/app_src/dist/index.html ./frontend/index.html
COPY --from=frontend-builder /app/app_src/dist/index.html ./frontend/menu.html
COPY --from=frontend-builder /app/app_src/dist/assets/ ./frontend/assets/

# Empaquetar el JAR ejecutable con el frontend integrado
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# ========================================================
# ETAPA 3: Imagen Ligera de Ejecución (JRE 21)
# ========================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado desde la etapa de compilación
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Carpetas para persistencia de base de datos H2 y subida de archivos
RUN mkdir -p /app/data /app/uploads

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

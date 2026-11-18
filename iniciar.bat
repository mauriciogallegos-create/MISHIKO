@echo off
echo ============================================
echo   MISHIKO - Sistema de Pedidos de Restaurante
echo ============================================
echo.

:: Verificar XAMPP MySQL
echo [1/3] Verificando MySQL (XAMPP)...
sc query MySQL 2>nul | find "RUNNING" >nul
if errorlevel 1 (
    echo    MySQL no esta corriendo. Iniciando...
    net start MySQL 2>nul
    timeout /t 3 /nobreak >nul
) else (
    echo    MySQL: OK
)

:: Crear base de datos si no existe
echo [2/3] Creando base de datos...
"C:\xampp\mysql\bin\mysql" -u root -e "CREATE DATABASE IF NOT EXISTS mishiko_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if errorlevel 1 (
    echo    AVISO: No se pudo conectar a MySQL automaticamente.
    echo    Por favor, abre XAMPP Control Panel, inicia MySQL,
    echo    y ejecuta manualmente: database\mishiko_schema.sql
) else (
    echo    Ejecutando schema...
    "C:\xampp\mysql\bin\mysql" -u root mishiko_db < "database\mishiko_schema.sql" 2>nul
    echo    Cargando datos iniciales...
    "C:\xampp\mysql\bin\mysql" -u root mishiko_db < "database\mishiko_data.sql" 2>nul
    echo    Base de datos: OK
)

:: Iniciar Backend Spring Boot
echo [3/3] Iniciando Backend Spring Boot (puerto 8080)...
echo.
echo    Cuando el servidor este listo, abre:
echo    - Menu cliente: frontend\index.html
echo    - Admin:        frontend\login.html (admin@mishiko.com / admin123)
echo    - Cocina:       frontend\cocina\consola.html
echo    - API Docs:     http://localhost:8080/swagger-ui/index.html
echo.
cd backend
mvn spring-boot:run

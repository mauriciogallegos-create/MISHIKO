@echo off
title MISHIKO - Sistema de Pedidos Inteligente
echo ========================================================
echo   MISHIKO - Sistema de Pedidos y Mascota Virtual 3D
echo   Base de Datos: H2 Integrada (Sin necesidad de XAMPP)
echo ========================================================
echo.

:: 1. Iniciar Backend Spring Boot con Base de Datos H2 integrada
echo [1/2] Iniciando Backend Spring Boot en el puerto 8080...
echo.
echo    Cuando el servidor arranque correctamente, abre en tu navegador:
echo    ----------------------------------------------------------------
echo    * Menu Cliente (QR Mesa 1):  http://localhost:8080/api/menu.html?restauranteId=1^&mesa=1^&mesaId=1
echo    * Pagina de Inicio / QR:     http://localhost:8080/api/index.html
echo    * Panel de Administracion:   http://localhost:8080/api/admin/dashboard.html
echo                                 (Usuario: admin@mishiko.com  /  Clave: admin123)
echo    * Gestion de Mesas y QR:     http://localhost:8080/api/admin/mesas.html
echo    * Gestion de Categorias:     http://localhost:8080/api/admin/categorias.html
echo    * Consola de Cocina:         http://localhost:8080/api/cocina/consola.html
echo    * Mascota Virtual Michi:     http://localhost:8080/api/mascota/michi.html
echo    * Consola BD H2:             http://localhost:8080/api/h2-console
echo    ----------------------------------------------------------------
echo.

cd backend
mvn spring-boot:run

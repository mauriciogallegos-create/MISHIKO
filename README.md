# 🐱 MISHIKO – Sistema de Pedidos para Restaurantes

> Plataforma web para digitalizar la gestión de pedidos mediante menú QR, panel administrativo, consola de cocina y mascota virtual Michi 3D.

## 🚀 Inicio Rápido

### Prerequisitos
- Java 21 (JetBrains JBR o similar)
- Apache Maven 3.9+
- MySQL 8.0 o 8.4 corriendo
- Node.js (opcional, solo para servidor de archivos estáticos)

### Pasos

**1. Iniciar MySQL**

Inicia el servicio local de MySQL 8.

**2. Crear la base de datos**
```bash
# Abrir MySQL desde phpMyAdmin o consola
mysql -u root < database/mishiko_schema.sql
mysql -u root mishiko_db < database/mishiko_data.sql
mysql -u root mishiko_db < database/mishiko_jpa_alignment.sql
```

En una base creada previamente con los dos scripts originales, aplica únicamente
`mishiko_jpa_alignment.sql` una vez.

**3. Iniciar el backend**
```bash
cd backend
mvn spring-boot:run
```
El backend sirve también el frontend en `http://localhost:8080/api/index.html`.
Desde esa página puedes generar el QR de una mesa. Para escanearlo con otro
dispositivo, abre la portada usando una IP o un dominio accesible desde ese
dispositivo. Usa la misma dirección al generar el QR.

**4. Abrir el frontend**

Abre directamente en el navegador:
- `frontend/index.html` → Landing page
- `frontend/menu.html?restauranteId=1&mesa=1&mesaId=1` → Menú del cliente
- `frontend/login.html` → Panel Admin/Cocina

> **Recomendado**: Usa la extensión "Live Server" de VS Code o cualquier servidor local para evitar restricciones CORS al abrir archivos HTML directamente.

---

## 📂 Estructura del Proyecto

```
MISHIKO/
├── backend/                    ← Spring Boot (Java 21, Maven)
│   └── src/main/java/com/mishiko/
│       ├── domain/model/       ← Entidades JPA
│       ├── application/usecase/← Casos de uso (lógica de negocio)
│       └── infrastructure/     ← Controladores REST, repositorios, seguridad
├── frontend/                   ← HTML + CSS + JS
│   ├── index.html              ← Landing page
│   ├── menu.html               ← Menú digital del cliente
│   ├── seguimiento.html        ← Seguimiento de pedido
│   ├── comprobante.html        ← Ver/descargar comprobante PDF
│   ├── login.html              ← Login del personal
│   ├── admin/                  ← Panel administrativo
│   ├── cocina/                 ← Consola de cocina
│   └── mascota/                ← Personalización de Michi
├── database/
│   ├── mishiko_schema.sql      ← Esquema completo (12 tablas)
│   └── mishiko_data.sql        ← Datos iniciales
└── iniciar.bat                 ← Script de inicio (Windows)
```

---

## 🔑 Credenciales por defecto

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Admin MISHIKO | admin@mishiko.com | admin123 | ADMIN |

---

## 🌐 Endpoints API

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/menu` | Menú completo por restaurante | No |
| GET | `/api/productos` | Listar productos | No |
| GET | `/api/categorias` | Listar categorías | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/register` | Registrarse | No |
| POST | `/api/pedidos` | Crear pedido | No |
| GET | `/api/pedidos/{id}` | Ver pedido | No |
| GET | `/api/pedidos/numero/{num}` | Buscar por número | No |
| PUT | `/api/pedidos/{id}/estado` | Cambiar estado | PERSONAL/COCINA/ADMIN |
| GET | `/api/admin/pedidos` | Todos los pedidos | ADMIN |
| GET | `/api/cocina/pedidos` | Pedidos activos | COCINA/ADMIN |
| GET | `/api/comprobantes/{id}` | Ver comprobante | No |
| GET | `/api/comprobantes/{id}/pdf` | Descargar PDF | No |
| PUT | `/api/mascota/preferencias` | Guardar config Michi | Autenticado |

**Documentación Swagger**: `http://localhost:8080/api/swagger-ui/index.html`

---

## 🐱 Michi – Mascota Virtual

- **3D**: Three.js con geometrías primitivas (sin dependencias externas)
- **Voz**: Web Speech Synthesis API (nativa del navegador)
- **Reconocimiento de voz**: Web Speech Recognition API (Chrome recomendado)
- **Personalización**: color de pelaje, nombre, volumen, activar/desactivar voz

---

## 🏗️ Arquitectura

```
Frontend (HTML/CSS/JS)
        ↓ REST API (JSON)
Backend Spring Boot (Monolito Modular)
  ├── domain/      ← Entidades + reglas de negocio
  ├── application/ ← Casos de uso
  └── infrastructure/ ← Adaptadores REST + repositorios JPA
        ↓ JPA/Hibernate
MySQL (XAMPP)
```

---

## ⚠️ Notas Importantes

- Los comprobantes PDF son **documentos internos de referencia**, no facturas electrónicas oficiales.
- Para facturación SUNAT se requiere integrar un sistema autorizado.
- El reconocimiento de voz funciona mejor en **Google Chrome**.
- No se usa Docker ni microservicios (MVP académico).

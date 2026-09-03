# Documentación de la API - Villa Ana Maria

La API de Villa Ana Maria está construida con NestJS y ofrece los siguientes módulos principales. Todas las rutas asumen el prefijo global `/api` (ej. `http://localhost:3000/api`).

Además, puedes consultar la documentación interactiva generada con Swagger ingresando a `/api/docs` desde tu navegador cuando el servidor esté corriendo.

---

## 1. Auth (Autenticación)

Módulo encargado del registro y autenticación de usuarios.

- **`POST /auth/register`**
  - **Descripción:** Registra un nuevo usuario en el sistema.
  - **Body esperado:** `name`, `email`, `password`.
  - **Respuestas:** `201 Created` (Éxito), `400 Bad Request` (Error de validación).

- **`POST /auth/login`**
  - **Descripción:** Autentica a un usuario y devuelve un token.
  - **Body esperado:** `email`, `password`.
  - **Respuestas:** `201 Created` (Éxito), `401 Unauthorized` (Credenciales inválidas).

- **`POST /auth/forgot-password`**
  - **Descripción:** Envía por correo un enlace para restablecer la contraseña. Responde siempre igual, exista o no la cuenta (no filtra qué correos están registrados). Enlace válido 1 hora. Requiere SMTP configurado (`SMTP_*` en `.env`); si no, el enlace se registra en el log del servidor.
  - **Body esperado:** `email`.
  - **Respuestas:** `201 Created` (`{ success: true }`), `400 Bad Request` (email mal formado). Límite: 3 por minuto.

- **`POST /auth/reset-password`**
  - **Descripción:** Fija una nueva contraseña usando el token recibido por correo. Quema el token (un solo uso) y cualquier otro pendiente del mismo usuario.
  - **Body esperado:** `token`, `password` (8–100 caracteres).
  - **Respuestas:** `201 Created` (`{ success: true }`), `400 Bad Request` (token inválido/expirado/usado o contraseña inválida). Límite: 5 por minuto.

---

## 2. Reservations (Reservas)

Módulo para la gestión de las reservas de cabañas/habitaciones.

- **`POST /reservations`**
  - **Descripción:** Crea una nueva reserva.
  - **Body esperado:** `roomId`, `checkIn`, `checkOut`, `firstName`, `lastName`, `email` (opcionales: `customerId`, `totalPrice`, `status`, `phone`, `document`).
  - **Respuestas:** `201 Created` (Éxito), `400 Bad Request` (Cabaña no disponible en esas fechas).

- **`GET /reservations`**
  - **Descripción:** Obtiene la lista de todas las reservas.
  - **Respuestas:** `200 OK`.

- **`GET /reservations/:id`**
  - **Descripción:** Obtiene los detalles de una reserva específica por su ID.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`PATCH /reservations/:id`**
  - **Descripción:** Actualiza los datos de una reserva existente.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`DELETE /reservations/:id`**
  - **Descripción:** Elimina una reserva del sistema.
  - **Respuestas:** `200 OK`, `404 Not Found`.

---

## 3. Rooms (Habitaciones / Cabañas)

Módulo para gestionar el catálogo de cabañas disponibles.

- **`POST /rooms`**
  - **Descripción:** Crea una nueva habitación/cabaña.
  - **Body esperado:** `name`, `description`, `capacity`, `pricePerNight`, `photoUrl`, `status`, `type`.
  - **Respuestas:** `201 Created`.

- **`GET /rooms`**
  - **Descripción:** Lista todas las habitaciones.
  - **Respuestas:** `200 OK`.

- **`GET /rooms/:id`**
  - **Descripción:** Obtiene la información detallada de una habitación por su ID.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`PATCH /rooms/:id`**
  - **Descripción:** Actualiza una habitación.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`DELETE /rooms/:id`**
  - **Descripción:** Elimina una habitación.
  - **Respuestas:** `200 OK`, `404 Not Found`.

---

## 4. Installations (Instalaciones)

Módulo para administrar áreas e instalaciones adicionales (piscinas, zonas verdes, etc.).

- **`POST /installations`** *(Requiere permisos: `installations:create`)*
  - **Descripción:** Crea una nueva instalación.
  - **Body esperado:** `slug`, `name` (opcionales: `description`, `isActive`).
  - **Respuestas:** `201 Created`.

- **`GET /installations`**
  - **Descripción:** Lista todas las instalaciones.
  - **Respuestas:** `200 OK`.

- **`GET /installations/:id`**
  - **Descripción:** Obtiene una instalación por ID.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`PATCH /installations/:id`** *(Requiere permisos: `installations:update`)*
  - **Descripción:** Modifica una instalación existente.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`DELETE /installations/:id`** *(Requiere permisos: `installations:delete`)*
  - **Descripción:** Elimina una instalación.
  - **Respuestas:** `200 OK`, `404 Not Found`.

---

## 5. Contact Messages (Mensajes de Contacto)

Módulo para gestionar los mensajes dejados por los usuarios desde la página web.

- **`POST /contact-messages`**
  - **Descripción:** Envía un nuevo mensaje de contacto.
  - **Body esperado:** `name`, `email`, `message` (opcional: `phone`).
  - **Respuestas:** `201 Created`.

- **`GET /contact-messages`** *(Requiere permisos: `contact_messages:read`)*
  - **Descripción:** Lista todos los mensajes de contacto recibidos.
  - **Respuestas:** `200 OK`.

- **`GET /contact-messages/:id`** *(Requiere permisos: `contact_messages:read`)*
  - **Descripción:** Lee un mensaje específico.
  - **Respuestas:** `200 OK`, `404 Not Found`.

- **`PATCH /contact-messages/:id/status`** *(Requiere permisos: `contact_messages:update`)*
  - **Descripción:** Cambia el estado del mensaje (ej: `pendiente`, `leido`, `respondido`, `archivado`).
  - **Respuestas:** `200 OK`, `404 Not Found`.

## 6. Content Sections (Secciones de Contenido)

**`GET /content-sections`** - Listar todas las secciones

**`GET /content-sections/:sectionName`** - Obtener sección por nombre
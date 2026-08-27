# Documentación del Backend: Villa Ana María API

Este documento resume la arquitectura, configuración y módulos desarrollados para el backend del proyecto **Villa Ana María**, construido con NestJS, Prisma ORM y PostgreSQL.

---

## 1. Arquitectura y Tecnologías
- **Framework Core:** NestJS (Node.js)
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma ORM (con `@prisma/adapter-pg` para conexiones directas)
- **Seguridad:** JSON Web Tokens (JWT) y Encriptación con Bcrypt
- **Documentación API:** Swagger (OpenAPI)

---

## 2. Base de Datos (Esquema Relacional)
Se diseñó una estructura de base de datos relacional altamente escalable en `schema.prisma`. 

**Módulos de Negocio:**
- **ContactMessage:** Almacena los mensajes enviados desde la página web pública.
- **Installation:** Instalaciones adicionales (pizzería, piscina, etc.).
- **Room:** Catálogo de habitaciones/cabañas reservables.
- **Reservation:** Gestión de reservas de clientes por habitación.
- **Customer:** Base de datos de huéspedes reales.
- **Page / ContentSection:** Gestor de contenidos dinámicos (CMS) para la web.
- **MediaAsset:** Biblioteca de medios central (tabla `media_assets`). Cada archivo subido a `/uploads` se registra aquí como recurso propio, reutilizable en varias secciones o habitaciones. La columna `path` (`/uploads/<archivo>`) es la clave de unión — `ContentSection.banner`, `ContentSection.images` y `Room.photoUrl` guardan ese string, no el `id`.
  - **Borrado lógico:** borrar una sección (o quitarle una imagen) ya **no borra ningún archivo** del disco; solo lo desvincula. Eliminar un recurso se hace desde la biblioteca (`DELETE /api/media/:id`), que primero verifica que nadie lo referencie (responde `409` si está en uso) y, si está libre, marca `deletedAt` (papelera) dejando el archivo en disco. Se restaura con `POST /api/media/:id/restore`.
  - Permisos: `media:read`, `media:create`, `media:update`, `media:delete`.
  - Backfill de lo ya existente: `npx tsx prisma/backfill-media.ts` (una sola vez, idempotente).

**Módulo de Seguridad y Accesos (RBAC):**
- **User:** Credenciales de los administradores (contraseñas encriptadas).
- **Role:** Nivel de acceso (ej. `admin`).
- **Permission:** Acciones granulares del sistema (ej. `installations:create`).
- **UserRole / RolePermission:** Tablas intermedias para gestionar relaciones Muchos-a-Muchos.

### Script Semilla (`seed.ts`)
Se desarrolló un script automatizado (`npx prisma db seed`) que prepara la base de datos para producción insertando:
1. El usuario administrador (`admin@villaanamaria.com`), con la contraseña inicial que se pase por la variable de entorno `ADMIN_SEED_PASSWORD` (obligatoria solo la primera vez que se crea; reruns del seed nunca tocan la contraseña de un admin que ya existe — cámbiala desde el panel/login después del primer ingreso).
2. El rol `admin`.
3. Todos los permisos del sistema.
4. Las vinculaciones necesarias entre Usuario -> Rol -> Permisos.

---

## 3. Seguridad y Autorización
El sistema está protegido mediante un esquema de **Role-Based Access Control (RBAC)** implementado a través de Guards de NestJS.

- **AuthGuard:** Valida que el usuario tenga un Token JWT válido.
- **PermissionsGuard:** Valida que el rol del usuario tenga el permiso exacto requerido por la ruta (evaluando el decorador `@RequirePermissions()`).

**Ejemplo de Protección en Controladores:**
```typescript
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('installations:create')
  @Post()
  create(...)
```

---

## 4. Rutas y Controladores (API REST)

| Módulo      | Endpoint                        | Método                   | Acceso                | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **Auth**    | `/api/auth/login`               | `POST`                   | Público               | Autenticación y generación de JWT. |
| **Contact** | `/api/contact-messages`         | `POST`                   | Público               | Envío de mensajes desde la web. |
| **Contact** | `/api/contact-messages`         | `GET`, `PATCH`           | Privado (`admin`)     | Lectura y actualización de estados. |
| **Install** | `/api/installations`            | `GET`                    | Público               | Listar el catálogo de instalaciones. |
| **Install** | `/api/installations`            | `POST`, `PATCH`, `DELETE`| Privado (`admin`)     | Gestión de instalaciones adicionales. |
| **Rooms**   | `/api/rooms`                    | `GET`, `POST`, `PATCH`   | Mixto                 | Gestión de habitaciones reservables. |
| **Media**   | `/api/media`                    | `GET`, `POST`            | Privado (`media:*`)   | Listar y subir a la biblioteca de medios. |
| **Media**   | `/api/media/:id`                | `PATCH`, `DELETE`        | Privado (`media:*`)   | Editar metadatos / enviar a papelera (borrado lógico). |
| **Media**   | `/api/media/:id/restore`        | `POST`                   | Privado (`media:update`)| Restaurar un recurso desde la papelera. |

---

## 5. Configuraciones Globales (`main.ts`)
- **Prefijo Global:** Todas las rutas corren bajo `/api` (ej. `http://localhost:3000/api/...`).
- **Pipes de Validación:** Se usa `ValidationPipe` global con `whitelist: true` para bloquear cualquier dato basura o malicioso que intenten inyectar en los formularios.
- **CORS Habilitado:** Se ejecutó `app.enableCors()` permitiendo que aplicaciones Frontend en puertos diferentes (como React en `localhost:5173`) puedan consumir la API sin bloqueos de seguridad del navegador.

---

## 6. Documentación Automática (Swagger)
Se instaló y configuró `@nestjs/swagger`. 
Al correr el servidor en entorno de desarrollo (`npm run start:dev`), la documentación interactiva está disponible en:
👉 **`http://localhost:3000/api/docs`**

**Características de la Documentación:**
- Interfaz gráfica para explorar todas las rutas.
- Descripciones de los DTOs requeridos.
- Sistema de Autorización (`ApiBearerAuth`) integrado para probar rutas protegidas insertando el JWT directamente en la interfaz.

---

## 7. Integración con Frontend Realizada
Como Prueba de Concepto (PoC) final, se modificó el componente `contact.tsx` del proyecto en React (Rama: `pract`). 
Se reemplazó la lógica estática por un método `fetch` dinámico que serializa los datos y realiza un `POST /api/contact-messages` exitoso hacia el backend, capturando estados de carga (`isLoading`) y dibujando notificaciones de éxito y error según la respuesta HTTP.

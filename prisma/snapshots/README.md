# Snapshots de la base de datos

Respaldos en SQL para poder recuperar el contenido si la base se borra
(por ejemplo `prisma migrate reset`, `docker compose down -v` o
`docker volume rm`). **No hay backups automáticos ni PITR** (`archive_mode = off`).

| Archivo | Qué contiene | Cuándo se actualiza |
|---|---|---|
| `cms-content.sql` | `content_sections` + `media_assets` (todo el contenido editable del sitio: banners, galerías, textos, personajes) | cada vez que se ajusta el contenido desde el panel |
| `business-data.sql` | `rooms`, `customers`, `reservations`, `contact_messages` | punto en el tiempo — regenerar seguido |
| `full-backup.sql` | volcado completo con `--clean` (esquema + datos) — **no está versionado** (contiene el hash real de la contraseña del admin), solo vive en el disco local | punto en el tiempo |

## Regenerar los snapshots

```bash
docker exec villa-api-db-1 pg_dump -U postgres -d villa_db --data-only --column-inserts --no-owner \
  -t content_sections -t media_assets > prisma/snapshots/cms-content.sql

docker exec villa-api-db-1 pg_dump -U postgres -d villa_db --data-only --column-inserts --no-owner \
  -t rooms -t customers -t reservations -t contact_messages > prisma/snapshots/business-data.sql

docker exec villa-api-db-1 pg_dump -U postgres -d villa_db --no-owner --clean --if-exists \
  > prisma/snapshots/full-backup.sql
```

## Restaurar

Solo el contenido del sitio (no toca reservas ni usuarios):

```bash
docker exec -i villa-api-db-1 psql -U postgres -d villa_db < prisma/snapshots/cms-content.sql
```

> Si las tablas ya tienen filas, primero:
> `TRUNCATE content_sections, media_assets RESTART IDENTITY;`

Restaurar todo desde cero:

```bash
docker exec -i villa-api-db-1 psql -U postgres -d villa_db < prisma/snapshots/full-backup.sql
```

Las imágenes en sí viven en `backend/uploads/` y están versionadas en git, así
que no se pierden aunque se borre la base.

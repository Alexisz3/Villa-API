#!/bin/sh
set -e

# Aplica las migraciones pendientes antes de arrancar la API.
# Es idempotente: si no hay nada pendiente, no hace nada.
# Se corre desde la raiz del repo, que es donde viven prisma/ y
# prisma.config.ts (este ultimo aporta la url para el CLI via DATABASE_URL).
cd /usr/src/app
echo "-> prisma migrate deploy"
npx prisma migrate deploy

cd /usr/src/app/backend
echo "-> starting server"
exec node dist/main

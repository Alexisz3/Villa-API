FROM node:20-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# Copy root package.json and install root dependencies (like prisma)
COPY package*.json ./
RUN npm install

# Copy the rest of the workspace
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Install backend dependencies and build
WORKDIR /usr/src/app/backend
RUN npm install
RUN npm run build

# ---

FROM node:20-alpine

# Sin esto, un despliegue fuera de docker-compose arrancaria en modo dev:
# Swagger publico, CORS abierto y cookie de sesion sin el flag Secure.
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy root node_modules and Prisma (schema + migraciones + config del CLI)
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /usr/src/app/backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Copy backend
WORKDIR /usr/src/app/backend
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/package*.json ./
COPY --from=builder /usr/src/app/backend/dist ./dist

EXPOSE 3000

# El entrypoint corre `prisma migrate deploy` y luego arranca el servidor.
ENTRYPOINT [ "/usr/src/app/entrypoint.sh" ]

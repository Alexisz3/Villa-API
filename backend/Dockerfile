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

WORKDIR /usr/src/app

# Copy root node_modules and Prisma
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy backend
WORKDIR /usr/src/app/backend
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/package*.json ./
COPY --from=builder /usr/src/app/backend/dist ./dist

EXPOSE 3000

# Command to run the application from the backend directory
CMD [ "npm", "run", "start:prod" ]

# Stage 1: Build the frontend, and install server dependencies
FROM node:22 AS builder

WORKDIR /app

# Copy all files from the current directory
COPY . ./

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Install dependencies and build the frontend
WORKDIR /app
RUN npm install
RUN npm run build
RUN ls -la dist/


# Stage 2: Build the final server image
FROM node:22-slim

WORKDIR /app

# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist
# Copy server files (including node_modules)
COPY --from=builder /app/server ./server

WORKDIR /app/server

# Verify files exist
RUN ls -la && ls -la ../dist/

EXPOSE 8080

CMD ["node", "server.js"]

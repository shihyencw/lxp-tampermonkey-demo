# Stage 1: Build the frontend, and install server dependencies
FROM node:22 AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy all source files
COPY . ./

# Build the frontend
RUN npm run build

# Verify build output
RUN echo "=== Build completed ===" && \
    ls -la dist/ && \
    test -f dist/index.html || (echo "ERROR: index.html not found!" && exit 1)


# Stage 2: Build the final server image
FROM node:22-slim

WORKDIR /app

# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist
# Copy server files (including node_modules)
COPY --from=builder /app/server ./server

WORKDIR /app/server

# Verify files exist
RUN echo "=== Verifying deployment files ===" && \
    ls -la && \
    ls -la ../dist/ && \
    test -f ../dist/index.html || (echo "ERROR: index.html missing in production image!" && exit 1)

# Use non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080

CMD ["node", "server.js"]

# Stage 1: Build the frontend and install server dependencies
FROM node:22 AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install --omit=dev

# Copy all source files
COPY . ./

# Build the frontend
RUN npm run build

# Verify build output
RUN echo "=== Build completed ===" && \
    ls -la dist/ && \
    test -f dist/index.html || (echo "ERROR: index.html not found!" && exit 1)


# Stage 2: Production runtime image
FROM node:22-slim

# Create app directory structure
WORKDIR /app

# Create non-root user (Cloud Run compatible)
RUN groupadd -r nodejs && \
    useradd -r -g nodejs nodejs && \
    mkdir -p /app/dist /app/server && \
    chown -R nodejs:nodejs /app

# Copy built frontend assets from the builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy server files (including node_modules)
COPY --from=builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server/server.js ./server/

# Verify files exist and are accessible
RUN echo "=== Verifying deployment files ===" && \
    ls -la /app && \
    ls -la /app/dist/ && \
    ls -la /app/server/ && \
    test -f /app/dist/index.html || (echo "ERROR: index.html missing!" && exit 1) && \
    test -f /app/server/server.js || (echo "ERROR: server.js missing!" && exit 1)

# Switch to non-root user
USER nodejs

# Set working directory to server
WORKDIR /app/server

# Cloud Run expects the service to listen on PORT environment variable
# Default to 8080 if PORT is not set
ENV PORT=8080

# Expose port (documentation only, Cloud Run uses PORT env var)
EXPOSE 8080

# Start server (no healthcheck in CMD for Cloud Run compatibility)
CMD ["node", "server.js"]

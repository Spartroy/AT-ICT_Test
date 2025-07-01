# Multi-stage Dockerfile for AT-ICT LMS

# Stage 1: Build React Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Setup Backend
FROM node:18-alpine as backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Create uploads directory
RUN mkdir -p uploads/assignments uploads/chat uploads/general uploads/materials/thumbnails

# Stage 3: Final image with Nginx for frontend and Node for backend
FROM node:18-alpine
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy backend
COPY --from=backend /app ./

# Copy frontend build
COPY --from=frontend-build /app/client/build ./public

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/lib/nginx /run/nginx
RUN chown -R node:node /var/log/nginx /var/cache/nginx /var/lib/nginx /run/nginx /etc/nginx

# Expose ports
EXPOSE 80 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Switch to node user
USER node

# Start script
CMD ["sh", "-c", "nginx && npm start"] 
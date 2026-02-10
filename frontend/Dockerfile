# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy dependency definitions and sources
COPY frontend/package.json frontend/package.json
COPY frontend/package-lock.json* ./frontend/

# Install dependencies
WORKDIR /app/frontend
RUN npm install

# Copy source code (frontend and backend/api-service which is needed)
WORKDIR /app
COPY frontend/ ./frontend/
COPY backend/api-service/ ./backend/api-service/

# Build
WORKDIR /app/frontend
# Ensure the vite config produces a production build
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Nginx config for SPA (Single Page Application) and API Reverse Proxy
RUN echo 'server { \
    listen 80; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /ws { \
        proxy_pass http://backend:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
    \
    location ~ ^/(health|nodes|collections|query|docs|openapi.json) { \
        proxy_pass http://backend:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

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

# Nginx config for SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Base image
FROM node:26.2-alpine

RUN apk add --no-cache nginx gnupg unzip wget coreutils

# Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Frontend
WORKDIR /usr/share/nginx/html
COPY app/ ./

# Backend
WORKDIR /app
COPY api/server.js /app/server.js
RUN npm init -y \
  && npm install --omit=dev express cors digest-fetch \
  && npm cache clean --force

# Downloader + supervisor script
COPY download.sh /app/download.sh
COPY start.sh /app/start.sh
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/download.sh /app/entrypoint.sh /app/start.sh

EXPOSE 80
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
# syntax=docker/dockerfile:1
# Build stage: install exactly what package-lock.json says and build the static site.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage: nginx (unprivileged, port 8080). It serves the site and forwards /api to the backend,
# so the browser only ever talks to one origin and the session cookie stays first-party.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080

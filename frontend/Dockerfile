FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-fund --no-audit

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS final
WORKDIR /usr/share/nginx/html

ENV NGINX_BACKEND_UPSTREAM=http://host.docker.internal:8085
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist ./

EXPOSE 8080

# Etapa build: compila la SPA con Vite
FROM node:22-slim AS build
WORKDIR /app
ARG VITE_API_URL=http://187.7.20.13:3000/
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa producción: sirve el dist con nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
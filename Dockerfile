# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG VITE_BASE=/
ENV VITE_BASE=$VITE_BASE
RUN npm run build

FROM nginx:alpine
ARG PORT=3003
ENV PORT=$PORT
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE $PORT

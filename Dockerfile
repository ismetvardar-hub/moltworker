# AŞAMA 9 — OlymposPass / LİKYA CEO Paneli
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4173
ENV HOST=0.0.0.0
ENV AUTH_HIDE_HINTS=1
COPY --from=build /app/dist ./dist
COPY server ./server
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 4173
CMD ["node", "server/prod-server.js"]

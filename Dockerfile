FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY MinaPlay/package.json MinaPlay/package-lock.json ./
RUN npm ci

COPY MinaPlay/ ./
RUN npm run build \
  && npm prune --omit=dev

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/server.js"]

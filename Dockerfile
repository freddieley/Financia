FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000
ENV FINANCIA_STORAGE_PATH=/app/data/financia.json

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .env.example README.md SPECIFICATION.md api-contract.md architecture.md repo-layout.md ./
COPY src ./src

RUN npm run typecheck \
    && mkdir -p /app/data \
    && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.ts"]

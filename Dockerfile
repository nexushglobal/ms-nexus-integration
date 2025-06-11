FROM node:24-alpine AS base

RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY .npmrc* ./

RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY .npmrc* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8000}/api/users/health || exit 1

CMD ["node", "dist/main"]
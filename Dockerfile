# ── base ─────────────────────────────────────────────────────────────────────
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── pruner ────────────────────────────────────────────────────────────────────
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo@1.12.5
COPY . .
RUN turbo prune web --docker

# ── installer ─────────────────────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app

# Install deps from pruned lockfile (no source yet — better layer caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_APP_NAME=Dub
ARG NEXT_PUBLIC_APP_DOMAIN=app.dub.local
ARG NEXT_PUBLIC_APP_SHORT_DOMAIN=dub.local
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_PUBLIC_APP_SHORT_DOMAIN=$NEXT_PUBLIC_APP_SHORT_DOMAIN

# Copy full source on top of installed node_modules
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=web

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone output: server.js sits at the ROOT of .next/standalone/
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Static assets and public dir must live next to server.js
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

CMD ["node", "server.js"]

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── installer ─────────────────────────────────────────────────────────────────
# Copy package manifests first so the install layer is cached independently
# from source code changes. Full pnpm-lock.yaml avoids turbo-prune lockfile bugs.
FROM base AS installer
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json                   ./apps/web/
COPY packages/cli/package.json               ./packages/cli/
COPY packages/email/package.json             ./packages/email/
COPY packages/embeds/core/package.json       ./packages/embeds/core/
COPY packages/embeds/react/package.json      ./packages/embeds/react/
COPY packages/hubspot-app/package.json       ./packages/hubspot-app/
COPY packages/prisma/package.json            ./packages/prisma/
COPY packages/stripe-app/package.json        ./packages/stripe-app/
COPY packages/tailwind-config/package.json   ./packages/tailwind-config/
COPY packages/tinybird/package.json          ./packages/tinybird/
COPY packages/tsconfig/package.json          ./packages/tsconfig/
COPY packages/ui/package.json                ./packages/ui/
COPY packages/utils/package.json             ./packages/utils/

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_APP_NAME=Dub
ARG NEXT_PUBLIC_APP_DOMAIN=app.dub.local
ARG NEXT_PUBLIC_APP_SHORT_DOMAIN=dub.local
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_PUBLIC_APP_SHORT_DOMAIN=$NEXT_PUBLIC_APP_SHORT_DOMAIN

COPY . .
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

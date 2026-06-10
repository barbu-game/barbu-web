# syntax=docker/dockerfile:1
# Next.js standalone output keeps the runtime image small.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# NEXT_PUBLIC_* is inlined at build time, so the prod WS URL must be present here.
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Private @barbu-game/barbu-api lives on GitHub Packages; authenticate the install
# via a BuildKit secret (no token baked into a layer). pnpm-workspace.yaml carries the
# minimumReleaseAgeExclude that lets the just-published contract client install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=secret,id=node_auth \
    sh -c 'if [ -f /run/secrets/node_auth ]; then \
      printf "@barbu-game:registry=https://npm.pkg.github.com/\n//npm.pkg.github.com/:_authToken=%s\n" "$(cat /run/secrets/node_auth)" > .npmrc; \
    fi' \
 && pnpm install --frozen-lockfile \
 && rm -f .npmrc

COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

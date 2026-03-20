# ─────────────────────────────────────────────
# Stage 1: Builder
# Installs ALL dependencies and compiles TypeScript
# This stage is large — it exists only to produce
# the compiled output. It is discarded afterwards.
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer.
# If package.json hasn't changed, npm install is skipped
# on subsequent builds, saving significant time and bandwidth.
COPY package*.json ./

# Install all dependencies including devDependencies
# (needed for TypeScript compilation)
RUN npm ci

# Copy source code and compile TypeScript to JavaScript
COPY . .
RUN npm run build

# Remove devDependencies — we only want production deps
# in the final image
RUN npm prune --production

# ─────────────────────────────────────────────
# Stage 2: Runner
# Starts fresh from a clean Alpine image.
# Only copies compiled JS and production node_modules.
# Source .ts files, tests, devDependencies — all gone.
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user — running as root inside a container
# is a security risk. If the container is compromised,
# the attacker only gets limited user privileges.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what is needed to run the app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy prisma schema — needed at runtime for the client
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user
USER appuser

EXPOSE 3000

# Run the compiled JavaScript directly with Node
# No ts-node-dev, no TypeScript overhead at runtime
#CMD ["node", "dist/index.js"]
CMD ["sh", "start.sh"]

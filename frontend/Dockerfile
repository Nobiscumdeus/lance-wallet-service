# ─────────────────────────────────────────────
# Stage 1: Builder
# Installs dependencies and builds the React app
# into static HTML, CSS, and JS files.
# Vite, React, TypeScript — all devDependencies,
# none of which belong in a production container.
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependency layer separately from source code
COPY package*.json ./
RUN npm ci

# Copy source and build
# Vite outputs to /app/dist — just static files
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Runner
# nginx is a lightweight web server purpose-built
# for serving static files. The final image contains
# NO Node.js at all — just nginx (~23MB) and the
# built HTML/CSS/JS files from stage 1.
# ─────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for React Router support.
# Without this, refreshing any page other than /
# returns a 404 because nginx looks for a real file.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

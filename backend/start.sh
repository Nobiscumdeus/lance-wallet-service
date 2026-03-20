#!/bin/sh

# Run any pending Prisma migrations before starting the server.
# This means the database is always up to date when the app boots,
# even after schema changes — no manual migration step needed.
echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting server..."
node dist/index.js

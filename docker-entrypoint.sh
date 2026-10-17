#!/bin/sh
set -e

echo "==> Ensuring SQLite database schema is applied..."
npx prisma db push --skip-generate

echo "==> Starting Personal Project Dashboard..."
exec "$@"

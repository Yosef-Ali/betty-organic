#!/bin/sh

# Function to wait for the database
wait_for_db() {
  echo "Waiting for database to be ready..."
  while ! nc -z db 5432; do
    sleep 1
  done
  echo "Database is ready!"
}

# Wait for the database to be ready
wait_for_db

# Run database migrations
echo "Running database migrations..."
pnpm dlx prisma migrate deploy

# Start the application
echo "Starting the application..."
if [ "$NODE_ENV" = "production" ]; then
    pnpm start
else
    pnpm dev
fi

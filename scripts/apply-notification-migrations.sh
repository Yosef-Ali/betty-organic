#!/bin/bash

# Script to apply notification system migrations to Supabase

echo "Applying notification system migrations to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first."
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
fi

# Apply migrations
echo "Applying order notification trigger migration..."
supabase db push --db-url "$SUPABASE_DB_URL" supabase/migrations/20240401_order_notification_trigger.sql

echo "Applying realtime notification configuration..."
supabase db push --db-url "$SUPABASE_DB_URL" supabase/migrations/20240402_enable_realtime_notifications.sql

echo "Verifying migrations..."
supabase db diff --db-url "$SUPABASE_DB_URL"

echo "Migration complete. Please restart your application to apply changes."

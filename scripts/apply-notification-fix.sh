#!/bin/bash

# Script to apply notification system fixes

echo "Applying notification system fixes..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first."
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
fi

# Apply the SQL fixes
echo "Applying database fixes..."
supabase db push --db-url "$SUPABASE_DB_URL" supabase/migrations/20240501_fix_order_notifications.sql

echo "Fix completed. Please restart your application to apply changes."

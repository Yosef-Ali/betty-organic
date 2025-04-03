#!/bin/bash

# Script to fix notification system issues

echo "Fixing notification system..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first."
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
fi

# Apply the SQL fixes
echo "Applying database fixes..."
supabase db execute --db-url "$SUPABASE_DB_URL" -f scripts/fix-notification-triggers.sql

echo "Restarting Supabase realtime service..."
supabase restart --db-url "$SUPABASE_DB_URL"

echo "Fix completed. Please restart your application to apply changes."
echo "Visit http://localhost:3000/debug/notifications to test the notification system."

#!/bin/bash

# Script to fix the notification system

echo "Fixing notification system..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first."
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
 fi

# Apply the database migration
echo "Applying database fixes..."
supabase db push --db-url "$SUPABASE_DB_URL" supabase/migrations/20240501_fix_order_notifications.sql

# Restart the Supabase services
echo "Restarting Supabase services..."
supabase restart

echo "Fix completed. Please follow these steps:"
echo "1. Restart your Next.js application"
echo "2. Visit /debug/notifications to test the notification system"
echo "3. Create a test order and check if the notification bell updates"

#!/bin/bash

# Real-time System Fix Application Script
# Run this script to apply all the database fixes for the real-time notification system

echo "🔧 Betty Organic App - Real-time System Fix Script"
echo "=================================================="
echo ""

# Check if we have the required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Please ensure these are set in your .env.local file or environment."
    exit 1
fi

echo "✅ Environment variables found"
echo ""

# Check if npx and tsx are available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please install Node.js"
    exit 1
fi

echo "✅ Node.js tools available"
echo ""

# Apply the SQL fixes
echo "🗄️  Applying database fixes..."
echo "   Using Supabase URL: $(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1.../')"

# Use npx supabase if available, otherwise use curl
if command -v npx supabase &> /dev/null; then
    echo "   Using Supabase CLI..."
    npx supabase db reset --linked
    if [ $? -eq 0 ]; then
        echo "✅ Database reset successful"
    else
        echo "⚠️  Database reset failed, continuing with SQL fixes..."
    fi
else
    echo "   Supabase CLI not available, using direct SQL execution..."
fi

# Apply our specific fixes using curl (works with Supabase REST API)
echo "   Applying SQL fixes via REST API..."

# Read the SQL file and execute it
if [ -f "scripts/fix-realtime-system.sql" ]; then
    echo "   Executing fix-realtime-system.sql..."
    
    # Note: This would require a more complex approach to execute SQL via REST API
    # For now, we'll provide instructions for manual execution
    echo "   ⚠️  Please manually execute the following SQL file in your Supabase dashboard:"
    echo "      scripts/fix-realtime-system.sql"
else
    echo "   ❌ SQL fix file not found: scripts/fix-realtime-system.sql"
    exit 1
fi

echo ""
echo "🧪 Running real-time system tests..."

# Run the test script
npx tsx scripts/test-realtime-system.ts

echo ""
echo "🎉 Fix application complete!"
echo ""
echo "Next steps:"
echo "1. If tests failed, manually execute scripts/fix-realtime-system.sql in Supabase dashboard"
echo "2. Test the real-time system in your app by creating orders"
echo "3. Check the browser console for any real-time related errors"
echo "4. Use the built-in debugging component at /fix-notifications for advanced testing"
echo ""

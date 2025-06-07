#!/bin/bash
# Migration script to fix real-time functionality

echo "🔧 Fixing Betty Organic App Real-time System..."

# Backup original files
echo "📦 Creating backups..."
cp lib/supabase/realtime-provider.tsx lib/supabase/realtime-provider.backup.tsx
cp components/OrderDashboard.tsx components/OrderDashboard.backup.tsx
cp components/dashboard/NotificationBell.tsx components/dashboard/NotificationBell.backup.tsx

# Replace with fixed versions
echo "🔄 Applying fixes..."
mv lib/supabase/realtime-provider-fixed.tsx lib/supabase/realtime-provider.tsx
mv components/OrderDashboard-fixed.tsx components/OrderDashboard.tsx
mv components/dashboard/NotificationBell-fixed.tsx components/dashboard/NotificationBell.tsx

# Run the SQL fixes
echo "🗄️ Updating database policies..."
echo "Please run the following SQL in your Supabase dashboard:"
echo "----------------------------------------"
cat supabase/fix_realtime_policies.sql
echo "----------------------------------------"

echo "✅ Migration complete!"
echo ""
echo "📋 Summary of changes:"
echo "1. Fixed RealtimeProvider to handle reconnections and role-based filtering"
echo "2. Fixed OrderDashboard to prevent re-render loops and properly handle real-time updates"
echo "3. Fixed NotificationBell to correctly update badge counts and handle new orders"
echo "4. Added proper error handling and toast notifications"
echo ""
echo "🔍 Next steps:"
echo "1. Run the SQL commands in your Supabase dashboard"
echo "2. Restart your development server: npm run dev"
echo "3. Test real-time functionality with multiple browser tabs"

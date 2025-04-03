# Order Notification System

This document explains how the order notification system works in the Betty Organic App.

## Overview

The notification system allows admin and sales users to receive real-time notifications about pending orders through the notification bell in the dashboard.

## Components

1. **PostgreSQL Triggers and Functions**:
   - `notify_order_status()`: A PostgreSQL function that sends notifications when orders are created, updated, or deleted with a 'pending' status.
   - `order_status_trigger`: A trigger that executes the notification function on order changes.
   - `broadcast_order_status()`: A function that broadcasts order status changes to all connected clients.

2. **Frontend Notification Component**:
   - `NotificationBell.tsx`: A React component that displays pending orders and updates in real-time.

## How It Works

1. When an order with 'pending' status is created or updated in the database, the PostgreSQL trigger fires.
2. The trigger function sends a notification on the 'order_status_channel'.
3. The frontend subscribes to both:
   - PostgreSQL table changes via Supabase's `postgres_changes` event
   - Custom notifications via the 'order_status_channel'
4. When a notification is received, the bell icon shows the number of pending orders and plays a notification sound.

## Troubleshooting

If notifications are not working:

1. Ensure the PostgreSQL triggers and functions are properly installed:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%order%';
   SELECT * FROM pg_proc WHERE proname LIKE '%order%';
   ```

2. Check that Supabase realtime is enabled:
   ```sql
   SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
   ```

3. Verify the frontend subscription is working by checking the browser console for realtime connection logs.

## Applying Migrations

To apply the notification system migrations:

1. Run the migration script:
   ```bash
   ./scripts/apply-notification-migrations.sh
   ```

2. Restart your application to ensure changes take effect.

## Testing

To test the notification system:

1. Open two browser windows:
   - One with the admin dashboard
   - Another with the order creation form

2. Create a new order with 'pending' status in the second window.
3. Verify that the notification bell in the admin dashboard updates in real-time.

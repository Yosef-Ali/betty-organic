-- Create table for tracking WhatsApp message delivery status
-- This table stores webhook updates about message delivery status

CREATE TABLE IF NOT EXISTS whatsapp_message_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL, -- sent, delivered, read, failed
    timestamp TIMESTAMPTZ NOT NULL,
    recipient_id TEXT NOT NULL,
    errors JSONB, -- Store any error details from webhook
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on message_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_message_id 
ON whatsapp_message_status(message_id);

-- Create index on recipient_id for admin queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_recipient_id 
ON whatsapp_message_status(recipient_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_status 
ON whatsapp_message_status(status);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_timestamp 
ON whatsapp_message_status(timestamp);

-- RLS policies for security
ALTER TABLE whatsapp_message_status ENABLE ROW LEVEL SECURITY;

-- Admin users can view all message status
CREATE POLICY "Admin can view all message status" ON whatsapp_message_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- System can insert/update message status (for webhook)
CREATE POLICY "System can manage message status" ON whatsapp_message_status
    FOR ALL
    USING (true);

-- Add comments
COMMENT ON TABLE whatsapp_message_status IS 'Tracks delivery status of WhatsApp messages via webhook updates';
COMMENT ON COLUMN whatsapp_message_status.message_id IS 'WhatsApp message ID from API response';
COMMENT ON COLUMN whatsapp_message_status.status IS 'Message delivery status: sent, delivered, read, failed';
COMMENT ON COLUMN whatsapp_message_status.timestamp IS 'Timestamp from WhatsApp webhook';
COMMENT ON COLUMN whatsapp_message_status.recipient_id IS 'Phone number of message recipient';
COMMENT ON COLUMN whatsapp_message_status.errors IS 'Error details if message failed';
#!/bin/bash

# Start ngrok and update Betty Organic configuration

echo "🚀 Starting ngrok for Betty Organic PDF WhatsApp testing..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please run ./setup-ngrok.sh first"
    exit 1
fi

# Start ngrok in the background and capture the URL
echo "📡 Starting ngrok on port 3000..."
ngrok http 3000 > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
sleep 2

# Get the public URL from ngrok API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | sed 's/"public_url":"//')

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Make sure ngrok is running properly."
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok is running at: $NGROK_URL"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env.local file with:"
echo "   NEXT_PUBLIC_NGROK_URL=$NGROK_URL"
echo ""
echo "2. Restart your Next.js app (Ctrl+C and npm run dev)"
echo ""
echo "3. Test PDF WhatsApp at: http://localhost:3000/test-pdf-whatsapp"
echo ""
echo "⚠️  Keep this terminal open while testing!"
echo "Press Ctrl+C to stop ngrok"

# Keep ngrok running
wait $NGROK_PID

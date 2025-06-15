#!/bin/bash

echo "🚀 Setting up ngrok for PDF WhatsApp testing..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 ngrok not found. Installing ngrok..."
    
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "Please install ngrok manually from https://ngrok.com/download"
            exit 1
        fi
    # For Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo "Please install ngrok manually from https://ngrok.com/download"
        exit 1
    fi
fi

echo "✅ ngrok is installed!"
echo ""
echo "📋 To use ngrok with your Betty Organic app:"
echo "1. Start your app: npm run dev"
echo "2. In a new terminal, run: ngrok http 3000"
echo "3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)"
echo "4. Update your .env.local file:"
echo "   NEXT_PUBLIC_NGROK_URL=https://your-subdomain.ngrok.io"
echo "5. Restart your app"
echo ""
echo "🔍 Testing the setup:"
echo "   Visit http://localhost:3000/test-pdf-whatsapp"

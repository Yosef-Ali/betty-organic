#!/bin/bash

# Script to run the remote Supabase fix

echo "Running remote Supabase fix..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first."
    exit 1
fi

# Check if required packages are installed
if ! node -e "require('@supabase/supabase-js'); require('dotenv');" &> /dev/null; then
    echo "Installing required packages..."
    npm install @supabase/supabase-js dotenv
fi

# Run the remote fix script
node -r dotenv/config scripts/remote-fix.js

echo "Script execution completed."

#!/bin/bash

# Script to run the alternative fix for notification issues

echo "Running alternative notification system fix..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first."
    exit 1
fi

# Run the alternative fix script
node -r dotenv/config scripts/fix-notifications-alternative.js

echo "Script execution completed."

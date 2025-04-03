#!/bin/bash

# Script to run the notification system test

echo "Running notification system test..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first."
    exit 1
fi

# Run the test script
node -r dotenv/config scripts/test-notification-system.js

echo "Test completed."

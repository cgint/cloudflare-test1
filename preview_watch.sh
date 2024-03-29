#!/bin/bash

# Start 'watch' in the background and remember its process ID (PID)
npm run watch &
WATCH_PID=$!

# Define a cleanup function that will be executed when the script exits
cleanup() {
  echo "Stopping watch..."
  kill $WATCH_PID
}

# Trap the EXIT signal to call the cleanup function
trap cleanup EXIT

# Run 'preview' in the foreground
npm run preview

# The script will automatically call cleanup when it exits, stopping 'watch'
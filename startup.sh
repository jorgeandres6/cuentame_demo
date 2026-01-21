#!/bin/bash
set -e

echo "=========================================="
echo "CUENTAME - Build Script for Azure"
echo "=========================================="

# Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Build React/Vite app
echo "Building frontend..."
npm run build

# Check if server.js exists
if [ -f "server.js" ]; then
  echo "✅ Server.js found - API server ready"
else
  echo "❌ Server.js not found!"
  exit 1
fi

echo "=========================================="
echo "✅ Build completed successfully!"
echo "=========================================="

# Start the server
echo "Starting server..."
npm start

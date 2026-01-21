#!/bin/bash
# Pre-start check script
# Ensures dependencies are installed before running the server

set -e

echo "🔍 Pre-start dependency check..."

# Check if node_modules exists and has express
if [ ! -d "node_modules/express" ]; then
  echo "⚠️  Dependencies missing! Installing..."
  npm ci --production --no-audit --no-fund --legacy-peer-deps 2>&1 | grep -E "added|up to date|packages" || true
  
  if [ ! -d "node_modules/express" ]; then
    echo "❌ CRITICAL: Failed to install express!"
    exit 1
  fi
  echo "✅ Dependencies installed"
fi

# Check if dist exists (React build)
if [ ! -d "dist" ]; then
  echo "⚠️  dist/ missing! Building frontend..."
  npm run build
fi

echo "✅ Pre-start checks passed"

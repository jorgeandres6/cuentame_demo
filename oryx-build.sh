#!/bin/bash
# Oryx Custom Build Script for Node.js
# This script prevents Oryx from attempting .NET detection

set -e

echo "🔵 Starting custom Oryx build for Node.js..."
echo "Environment: $(uname -a)"

# 1. Verify Node.js version
echo "✓ Checking Node.js version..."
node --version
npm --version

# 2. Install production dependencies only
echo "✓ Installing production dependencies..."
npm ci --production --no-audit --no-fund 2>&1 | head -20

# 3. Build React frontend with Vite
echo "✓ Building React frontend with Vite..."
npm run build

# 4. Verify build output
echo "✓ Verifying build output..."
if [ -d "dist" ]; then
  echo "  ✓ dist/ directory created successfully"
  ls -la dist | head -5
else
  echo "  ✗ ERROR: dist/ directory not found!"
  exit 1
fi

# 5. Verify server.js exists
echo "✓ Verifying server.js exists..."
if [ -f "server.js" ]; then
  echo "  ✓ server.js found"
else
  echo "  ✗ ERROR: server.js not found!"
  exit 1
fi

# 6. Check dependencies
echo "✓ Checking critical dependencies..."
if node -e "require('./package.json')" 2>/dev/null; then
  echo "  ✓ package.json valid"
else
  echo "  ✗ ERROR: Invalid package.json"
  exit 1
fi

echo ""
echo "🟢 Build completed successfully!"
echo "   Next: npm start will run server.js"
echo "   Server will listen on PORT env var (Azure uses 8080)"
echo ""

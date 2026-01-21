#!/bin/bash
# 🚀 Azure App Service Startup Script
# Ensures all dependencies are installed before starting the server

set -e

echo "════════════════════════════════════════════"
echo "🚀 CUENTAME App Service Startup"
echo "════════════════════════════════════════════"

# Step 1: Verify Node.js
echo ""
echo "📋 Step 1: Verifying Node.js..."
node --version
npm --version

# Step 2: Check if node_modules exists
echo ""
echo "📋 Step 2: Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "⚠️  Dependencies not found. Installing..."
  npm ci --production --no-audit --no-fund --legacy-peer-deps
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi

# Step 3: Verify critical dependencies
echo ""
echo "📋 Step 3: Verifying critical packages..."
required_packages=("express" "mssql" "cors" "dotenv")
for pkg in "${required_packages[@]}"; do
  if [ ! -d "node_modules/$pkg" ]; then
    echo "❌ CRITICAL: Package '$pkg' not found!"
    exit 1
  fi
  echo "  ✅ $pkg"
done

# Step 4: Check if dist exists (React build)
echo ""
echo "📋 Step 4: Checking React build..."
if [ ! -d "dist" ]; then
  echo "⚠️  dist/ not found. Building React..."
  npm run build
  echo "✅ React built"
else
  echo "✅ dist/ already exists"
fi

# Step 5: Verify server.js exists
echo ""
echo "📋 Step 5: Verifying server.js..."
if [ ! -f "server.js" ]; then
  echo "❌ CRITICAL: server.js not found!"
  exit 1
fi
echo "✅ server.js present"

# Step 6: Set PORT if not set
echo ""
echo "📋 Step 6: Configuring port..."
export PORT=${PORT:-8080}
echo "✅ Using PORT=$PORT"

# Step 7: Start the server
echo ""
echo "════════════════════════════════════════════"
echo "🚀 Starting server on port $PORT..."
echo "════════════════════════════════════════════"
echo ""

exec node server.js

#!/bin/bash

# 🚀 Azure Deployment Script for CUENTAME
# This script is called by Azure App Service to deploy the application

set -e

DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-.}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-/home/site/wwwroot}

echo "════════════════════════════════════════════"
echo "🚀 CUENTAME Azure Deployment Script"
echo "════════════════════════════════════════════"

# 1. Navigate to deployment target
cd "$DEPLOYMENT_TARGET" || exit 1
echo "✅ Working directory: $(pwd)"

# 2. Install dependencies using npm ci for production
echo ""
echo "📦 Installing dependencies..."
npm ci --production --no-audit --no-fund --legacy-peer-deps 2>&1 | tail -5
echo "✅ Dependencies installed"

# 3. Verify critical packages
echo ""
echo "🔍 Verifying critical packages..."
if [ ! -d "node_modules/express" ]; then
  echo "❌ ERROR: express not found after npm ci!"
  echo "Available modules: $(ls node_modules | head -10)"
  exit 1
fi
echo "✅ express verified"

# 4. Build React frontend if dist doesn't exist
echo ""
echo "🔨 Building frontend..."
if [ ! -d "dist" ]; then
  npm run build 2>&1 | tail -10
  echo "✅ Frontend built"
else
  echo "✅ dist/ already exists"
fi

# 5. Verify server.js
echo ""
echo "🔍 Verifying server.js..."
if [ ! -f "server.js" ]; then
  echo "❌ ERROR: server.js not found!"
  exit 1
fi
echo "✅ server.js verified"

echo ""
echo "════════════════════════════════════════════"
echo "✅ Deployment preparation complete!"
echo "════════════════════════════════════════════"
echo ""
echo "Next: Azure App Service will execute 'npm start'"

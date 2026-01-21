#!/bin/bash
# Post-install script for Azure App Service
# Ejecutado después de que Oryx instala las dependencias

set -e

echo "🔵 [POST-INSTALL] Starting post-install configuration..."

# Verificar que las dependencias se instalaron
if [ ! -d "node_modules" ]; then
  echo "❌ [POST-INSTALL] node_modules not found! Installing..."
  npm ci --production --no-audit --no-fund
fi

# Verificar Express está instalado
if [ ! -d "node_modules/express" ]; then
  echo "❌ [POST-INSTALL] express not found! This is critical."
  echo "❌ [POST-INSTALL] node_modules integrity issue detected."
  exit 1
fi

echo "✅ [POST-INSTALL] All dependencies verified"
echo "✅ [POST-INSTALL] Ready to start server"

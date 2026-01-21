#!/bin/bash
# Setup Script para Azure SQL Database - CUÉNTAME
# Este script automatiza la configuración inicial

echo "🚀 INICIO DE CONFIGURACIÓN AZURE SQL - CUÉNTAME"
echo "=================================================="

# Función para imprimir pasos
step() {
    echo ""
    echo "📍 PASO $1: $2"
    echo "─────────────────────────────────────"
}

# Verificar Node.js
step 1 "Verificando Node.js"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Descargarlo de: https://nodejs.org"
    exit 1
fi
echo "✅ Node.js v$(node -v)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi
echo "✅ npm v$(npm -v)"

# Instalar dependencias
step 2 "Instalando dependencias"
npm install
echo "✅ Dependencias instaladas"

# Verificar .env.local
step 3 "Verificando variables de entorno"
if [ ! -f .env.local ]; then
    echo "⚠️  Archivo .env.local no encontrado"
    echo "   Se creó con valores de ejemplo"
    echo "   IMPORTANTE: Actualizar con tus credenciales de Azure"
fi

# Crear archivo de configuración
step 4 "Creando configuración"
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
# Azure SQL Configuration
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=your-password

# API Configuration
REACT_APP_API_URL=http://localhost:3000
PORT=3000

# Gemini API
GEMINI_API_KEY=your-gemini-key

# Environment
NODE_ENV=development
EOF
    echo "✅ Archivo .env.local creado"
fi

# Summary
echo ""
echo "✅ ¡CONFIGURACIÓN COMPLETADA!"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "─────────────────────────────────────"
echo "1. Editar .env.local con tus credenciales de Azure"
echo "2. Ejecutar: npm run seed"
echo "3. Iniciar servidor: npm run dev:server"
echo "4. En otra terminal: npm run dev"
echo ""
echo "🌐 Acceder a: http://localhost:5173"
echo "📚 Documentación: Ver AZURE_SETUP.md"
echo ""

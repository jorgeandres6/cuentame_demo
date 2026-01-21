# Setup Script para Azure SQL Database - CUÉNTAME (PowerShell)
# Para Windows: Ejecutar con: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "🚀 INICIO DE CONFIGURACIÓN AZURE SQL - CUÉNTAME" -ForegroundColor Green
Write-Host "================================================== " -ForegroundColor Green
Write-Host ""

# Función para imprimir pasos
function Step {
    param([int]$Number, [string]$Description)
    Write-Host ""
    Write-Host "📍 PASO $Number`: $Description" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────" -ForegroundColor Gray
}

# Verificar Node.js
Step 1 "Verificando Node.js"
$nodeExists = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
if (-not $nodeExists) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Descargarlo de: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = (node --version)
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# Verificar npm
$npmExists = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $npmExists) {
    Write-Host "❌ npm no está instalado" -ForegroundColor Red
    exit 1
}
$npmVersion = (npm --version)
Write-Host "✅ npm v$npmVersion" -ForegroundColor Green

# Instalar dependencias
Step 2 "Instalando dependencias"
npm install
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green

# Verificar .env.local
Step 3 "Verificando variables de entorno"
if (-not (Test-Path .env.local)) {
    Write-Host "⚠️  Archivo .env.local no encontrado" -ForegroundColor Yellow
    Write-Host "   Se creará con valores de ejemplo" -ForegroundColor Yellow
}

# Crear archivo de configuración
Step 4 "Creando configuración"
if (-not (Test-Path .env.local)) {
    $envContent = @"
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
"@
    
    Set-Content -Path .env.local -Value $envContent
    Write-Host "✅ Archivo .env.local creado" -ForegroundColor Green
    Write-Host "   IMPORTANTE: Actualizar con tus credenciales de Azure" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "✅ ¡CONFIGURACIÓN COMPLETADA!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Green
Write-Host "─────────────────────────────────────" -ForegroundColor Gray
Write-Host "1. Editar .env.local con tus credenciales de Azure" -ForegroundColor White
Write-Host "2. Ejecutar: npm run seed" -ForegroundColor White
Write-Host "3. Iniciar servidor: npm run dev:server" -ForegroundColor White
Write-Host "4. En otra terminal: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Acceder a: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📚 Documentación: Ver AZURE_SETUP.md" -ForegroundColor Cyan
Write-Host ""

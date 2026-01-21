# Script para desplegar a Azure Web App
param(
    [string]$ResourceGroup = "mi-grupo-recursos",
    [string]$AppServicePlan = "mi-plan-app",
    [string]$WebAppName = "cuentame-app",
    [string]$Location = "eastus",
    [string]$GeminiApiKey = ""
)

Write-Host "🚀 Iniciando deployment a Azure Web App..." -ForegroundColor Green

# 1. Verificar que estamos logueados
Write-Host "1️⃣ Verificando autenticación de Azure..." -ForegroundColor Cyan
$account = az account show 2>$null
if (!$account) {
    Write-Host "Abriendo navegador para login..." -ForegroundColor Yellow
    az login
}

# 2. Crear grupo de recursos
Write-Host "2️⃣ Creando/Verificando grupo de recursos: $ResourceGroup" -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --only-show-errors

# 3. Crear plan de App Service (SKU F1 es gratuito)
Write-Host "3️⃣ Creando/Verificando plan: $AppServicePlan" -ForegroundColor Cyan
az appservice plan create --name $AppServicePlan --resource-group $ResourceGroup --sku F1 --only-show-errors

# 4. Crear o actualizar Web App
Write-Host "4️⃣ Creando/Verificando Web App: $WebAppName" -ForegroundColor Cyan
az webapp create --resource-group $ResourceGroup --plan $AppServicePlan --name $WebAppName --runtime "NODE:18-lts" --only-show-errors

# 5. Configurar variables de entorno
if ($GeminiApiKey) {
    Write-Host "5️⃣ Configurando variables de entorno..." -ForegroundColor Cyan
    az webapp config appsettings set `
        --resource-group $ResourceGroup `
        --name $WebAppName `
        --settings GEMINI_API_KEY=$GeminiApiKey `
        --only-show-errors
} else {
    Write-Host "5️⃣ ⚠️ Omitiendo API key (pasar con -GeminiApiKey para configurar)" -ForegroundColor Yellow
}

# 6. Build
Write-Host "6️⃣ Compilando proyecto..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build" -ForegroundColor Red
    exit 1
}

# 7. Crear ZIP
Write-Host "7️⃣ Preparando archivos para upload..." -ForegroundColor Cyan
if (Test-Path "dist.zip") {
    Remove-Item "dist.zip"
}
Compress-Archive -Path "dist", "web.config" -DestinationPath "dist.zip" -Force

# 8. Deploy
Write-Host "8️⃣ Desplegando a Azure..." -ForegroundColor Cyan
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $WebAppName `
    --src "dist.zip"

# 9. Mostrar URL
$webAppUrl = "https://$WebAppName.azurewebsites.net"
Write-Host "✅ ¡Deployment completado!" -ForegroundColor Green
Write-Host "📱 Tu app está disponible en: $webAppUrl" -ForegroundColor Cyan
Write-Host "📊 Monitoreo: https://portal.azure.com" -ForegroundColor Cyan

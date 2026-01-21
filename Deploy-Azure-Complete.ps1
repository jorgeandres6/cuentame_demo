# Script de Deployment a Azure - LISTO PARA USAR
# Copia este contenido en PowerShell y ejecuta

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SCRIPT DE DEPLOYMENT A AZURE (CUENTAME)     " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ============ VARIABLES ============
$projectPath = "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo"
$parentPath = "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME"
$zipName = "cuentame_deploy.zip"
$zipPath = "$parentPath\$zipName"
$resourceGroup = "cuentame-rg"
$appServiceName = "cuentame-app"

# ============ PASO 1: VALIDAR RUTAS ============
Write-Host "Paso 1: Validando rutas..." -ForegroundColor Yellow
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: No se encontró la ruta: $projectPath" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Ruta encontrada: $projectPath" -ForegroundColor Green

# ============ PASO 2: LIMPIAR node_modules ============
Write-Host "Paso 2: Limpiando node_modules..." -ForegroundColor Yellow
if (Test-Path "$projectPath\node_modules") {
    Remove-Item -Path "$projectPath\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ node_modules eliminado" -ForegroundColor Green
}

# ============ PASO 3: INSTALAR DEPENDENCIAS ============
Write-Host "Paso 3: Instalando dependencias..." -ForegroundColor Yellow
Set-Location $projectPath
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install falló" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencias instaladas" -ForegroundColor Green

# ============ PASO 4: COMPILAR FRONTEND ============
Write-Host "Paso 4: Compilando frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm run build falló" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend compilado" -ForegroundColor Green

# ============ PASO 5: VERIFICAR .env.production ============
Write-Host "Paso 5: Verificando .env.production..." -ForegroundColor Yellow
$envProduction = "$projectPath\.env.production"
if (-not (Test-Path $envProduction)) {
    Write-Host "ADVERTENCIA: No existe .env.production" -ForegroundColor Yellow
    Write-Host "Se necesita para el deployment. Crearemos uno..." -ForegroundColor Yellow
    
    $envContent = @"
AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password-Fuerte-2026
REACT_APP_API_URL=https://$appServiceName.azurewebsites.net
PORT=3000
GEMINI_API_KEY=tu_gemini_key
"@
    
    $envContent | Out-File -FilePath $envProduction -Encoding UTF8
    Write-Host "✓ .env.production creado (ACTUALIZA LOS VALORES!)" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env.production existe" -ForegroundColor Green
}

# ============ PASO 6: ELIMINAR ZIP ANTERIOR ============
Write-Host "Paso 6: Preparando zip..." -ForegroundColor Yellow
if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
    Write-Host "✓ ZIP anterior eliminado" -ForegroundColor Green
}

# ============ PASO 7: CREAR ZIP ============
Write-Host "Paso 7: Creando archivo ZIP..." -ForegroundColor Yellow
Set-Location $parentPath
Compress-Archive -Path ".\cuentame_demo\*" -DestinationPath $zipName -Force

if (Test-Path $zipPath) {
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "✓ ZIP creado exitosamente" -ForegroundColor Green
    Write-Host "  Tamaño: $([Math]::Round($zipSize, 2)) MB" -ForegroundColor Green
    Write-Host "  Ubicación: $zipPath" -ForegroundColor Green
} else {
    Write-Host "ERROR: No se pudo crear el ZIP" -ForegroundColor Red
    exit 1
}

# ============ PASO 8: VERIFICAR CONTENIDO DEL ZIP ============
Write-Host "Paso 8: Verificando contenido del ZIP..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    
    $hasPackageJson = $false
    $hasServer = $false
    $hasDist = $false
    
    foreach ($entry in $zip.Entries) {
        if ($entry.Name -eq "package.json") { $hasPackageJson = $true }
        if ($entry.Name -eq "server.js") { $hasServer = $true }
        if ($entry.FullName -like "dist/*") { $hasDist = $true }
    }
    
    $zip.Dispose()
    
    Write-Host ""
    Write-Host "  Contenido del ZIP:" -ForegroundColor Cyan
    Write-Host "  $(if ($hasPackageJson) { '✓' } else { '✗' }) package.json" -ForegroundColor $(if ($hasPackageJson) { 'Green' } else { 'Red' })
    Write-Host "  $(if ($hasServer) { '✓' } else { '✗' }) server.js" -ForegroundColor $(if ($hasServer) { 'Green' } else { 'Red' })
    Write-Host "  $(if ($hasDist) { '✓' } else { '✗' }) dist/" -ForegroundColor $(if ($hasDist) { 'Green' } else { 'Red' })
    Write-Host ""
    
    if (-not ($hasPackageJson -and $hasServer -and $hasDist)) {
        Write-Host "ADVERTENCIA: Faltan archivos en el ZIP" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Advertencia: No se pudo verificar ZIP completo (continuando...)" -ForegroundColor Yellow
}

# ============ PASO 9: INSTRUCCIONES DE DEPLOYMENT ============
Write-Host "Paso 9: Instrucciones de Deployment" -ForegroundColor Yellow
Write-Host ""
Write-Host "El ZIP está listo para deployar. Elige una opción:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPCIÓN A: Deployment Manual (Azure Portal)" -ForegroundColor Green
Write-Host "  1. Ve a Azure Portal → App Service → $appServiceName" -ForegroundColor Gray
Write-Host "  2. Ve a Deployment Center → Local Git o ZIP Deploy" -ForegroundColor Gray
Write-Host "  3. Carga: $zipPath" -ForegroundColor Gray
Write-Host ""

Write-Host "OPCIÓN B: Deployment con Azure CLI (Recomendado)" -ForegroundColor Green
Write-Host "  1. Abre PowerShell" -ForegroundColor Gray
Write-Host "  2. Ejecuta:" -ForegroundColor Gray
Write-Host "     az login" -ForegroundColor Cyan
Write-Host "     az webapp deployment source config-zip ``" -ForegroundColor Cyan
Write-Host "       --resource-group $resourceGroup ``" -ForegroundColor Cyan
Write-Host "       --name $appServiceName ``" -ForegroundColor Cyan
Write-Host "       --src '$zipPath'" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPCIÓN C: Deployment con Git" -ForegroundColor Green
Write-Host "  1. Abre PowerShell en el directorio: $projectPath" -ForegroundColor Gray
Write-Host "  2. Ejecuta:" -ForegroundColor Gray
Write-Host "     git add ." -ForegroundColor Cyan
Write-Host "     git commit -m 'Deployment a Azure'" -ForegroundColor Cyan
Write-Host "     git push azure main" -ForegroundColor Cyan
Write-Host ""

# ============ PASO 10: VERIFICACIÓN POST-DEPLOYMENT ============
Write-Host "Paso 10: Después del Deployment" -ForegroundColor Yellow
Write-Host "  1. Espera 2-3 minutos por el build y deploy" -ForegroundColor Gray
Write-Host "  2. Verifica que esté online:" -ForegroundColor Gray
Write-Host "     https://$appServiceName.azurewebsites.net/api/health" -ForegroundColor Cyan
Write-Host "  3. Prueba login:" -ForegroundColor Gray
Write-Host "     https://$appServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "  4. Ver logs:" -ForegroundColor Gray
Write-Host "     az webapp log tail -g $resourceGroup -n $appServiceName" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ LISTO PARA DEPLOYMENT" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

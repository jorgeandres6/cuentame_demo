# 🚀 SOLUCIÓN: Error de Deployment a Azure (Oryx)

## ⚠️ El Problema

```
Error: Couldn't detect a version for the platform 'nodejs' in the repo.
```

**Causa:** Azure no encuentra `package.json` en el zip que enviaste.

---

## ✅ Solución: Preparar Deployment Correctamente

### Opción 1: Deployment Automático con Git (Recomendado)

**Ventajas:** Más fácil, automático, sin zip manual

#### Paso 1: Configurar Git Remote en Azure

```bash
# En tu terminal (PowerShell o CMD)
cd c:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo

# Agregar remote de Azure (cambiar valores)
git remote add azure https://cuentame-app.scm.azurewebsites.net:443/cuentame-app.git

# Configurar credenciales (si no las tienes)
# Ve a Azure Portal → App Service → Deployment Center → Local Git
```

#### Paso 2: Deploy con Git

```bash
git add .
git commit -m "Deployment a Azure"
git push azure main
```

---

### Opción 2: Manual con ZIP (Paso a Paso)

Si prefieres manual, aquí está la forma correcta:

#### Paso 1: Compilar la Aplicación

```bash
cd c:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo

# Limpiar node_modules anterior
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Instalar dependencias
npm install

# Compilar frontend
npm run build
```

#### Paso 2: Crear ZIP Correctamente

**⚠️ IMPORTANTE:** El package.json DEBE estar en la raíz del zip

```powershell
# En PowerShell
cd c:\Users\ADMI\Documents\PROYECTOS\CUENTAME

# Crear zip solo de cuentame_demo
Compress-Archive -Path .\cuentame_demo\* -DestinationPath cuentame_deploy.zip -Force

# Verificar contenido
# El zip debe contener:
# ✓ package.json (en raíz del zip)
# ✓ server.js
# ✓ dist/ (ya compilado)
# ✓ services/
# ✓ components/
# ✓ node_modules/ (opcional pero recomendado)
```

#### Paso 3: Deploy a Azure

**Opción A: Desde Azure Portal**

1. Ve a Azure Portal → App Service → Deployment Center
2. Haz clic en "Local Git" o "ZIP Deploy"
3. Carga el archivo `cuentame_deploy.zip`

**Opción B: Con CLI (Recomendado)**

```bash
# Instalar Azure CLI si no lo tienes
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login a Azure
az login

# Deploy del zip
az webapp deployment source config-zip --resource-group cuentame-rg --name cuentame-app --src C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_deploy.zip

# Ver logs
az webapp log tail --resource-group cuentame-rg --name cuentame-app
```

---

## 📝 Script Completo (Copiar y Pegar)

Aquí está todo en un script PowerShell:

```powershell
# ==========================================
# SCRIPT DE DEPLOYMENT A AZURE
# ==========================================

# 1. Ir al directorio correcto
cd "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo"

# 2. Limpiar e instalar
Write-Host "Limpiando node_modules..." -ForegroundColor Yellow
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

# 3. Compilar
Write-Host "Compilando frontend..." -ForegroundColor Yellow
npm run build

# 4. Crear ZIP desde el directorio padre
cd ..
Write-Host "Creando ZIP..." -ForegroundColor Yellow
Compress-Archive -Path ".\cuentame_demo\*" -DestinationPath "cuentame_deploy.zip" -Force

Write-Host "ZIP creado: $PWD\cuentame_deploy.zip" -ForegroundColor Green

# 5. Deploy a Azure (si tienes Azure CLI instalado)
# Descomenta para usar:
# Write-Host "Deployando a Azure..." -ForegroundColor Yellow
# az webapp deployment source config-zip `
#   --resource-group cuentame-rg `
#   --name cuentame-app `
#   --src "cuentame_deploy.zip"

Write-Host "¡Listo! Ahora sube el ZIP manualmente o usa az cli" -ForegroundColor Green
```

---

## 🔍 Verificar que el ZIP es Correcto

```powershell
# Listar contenido del zip
$zipPath = "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_deploy.zip"

# Con PowerShell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$zip.Entries | Select-Object -First 20 | Format-Table

# Debe contener:
# ✓ package.json
# ✓ server.js
# ✓ tsconfig.json
# ✓ dist/ (compilado)
# ✓ services/
# ✓ components/
# ✗ NO debe contener node_modules en raíz
```

---

## 🛠️ Checklist Antes de Deploy

- [ ] `npm install` ejecutado exitosamente
- [ ] `npm run build` sin errores
- [ ] `dist/` folder existe y contiene archivos
- [ ] `package.json` está en la raíz de cuentame_demo/
- [ ] `.env.production` tiene credenciales correctas de Azure SQL
- [ ] ZIP contiene `package.json` en la raíz
- [ ] Azure App Service está creado
- [ ] Firewall de SQL Database permite Azure Services

---

## 📋 Qué Debe Estar en el ZIP

```
cuentame_deploy.zip
├── package.json                    ← DEBE estar aquí
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── server.js
├── index.html
├── index.tsx
├── types.ts
├── .env.production                 ← Con credenciales Azure SQL
├── dist/                           ← Frontend compilado
│   ├── index.html
│   ├── assets/
│   └── ...
├── services/
│   ├── geminiService.ts
│   ├── storageService.ts
│   ├── workflowService.ts
│   └── ...
├── components/
│   ├── ChatInterface.tsx
│   ├── Dashboard.tsx
│   └── ...
└── node_modules/                  ← Opcional pero recomendado
    ├── express/
    ├── mssql/
    └── ...
```

---

## 🚨 Errores Comunes y Soluciones

### Error: "package.json not found"

**Causa:** El zip no está zipeado desde cuentame_demo/

**Solución:**
```powershell
# ❌ INCORRECTO
Compress-Archive -Path "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo" `
  -DestinationPath deploy.zip

# ✅ CORRECTO
cd "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME"
Compress-Archive -Path ".\cuentame_demo\*" -DestinationPath deploy.zip
```

### Error: "Couldn't detect version for nodejs"

**Causa:** Falta `package.json` en raíz del zip

**Solución:** Verifica que `package.json` esté en la raíz del zip (no dentro de una carpeta)

### Error: "npm install failed"

**Causa:** Faltan dependencias o package-lock.json corrupto

**Solución:**
```bash
npm ci  # Usa package-lock.json
# en lugar de:
npm install
```

---

## ✅ Verificar Deploy Exitoso

Una vez deployado, prueba:

```bash
# 1. Verificar que está online
https://cuentame-app.azurewebsites.net/api/health

# Debe retornar:
# {"status":"ok"}

# 2. Ver logs en tiempo real
az webapp log tail --resource-group cuentame-rg --name cuentame-app --follow

# 3. Probar login
curl -X POST https://cuentame-app.azurewebsites.net/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-2026-A","password":"123"}'
```

---

## 📞 Si Aún No Funciona

1. Verifica que `.env.production` existe y tiene:
```env
AZURE_SQL_SERVER=cuentame-server-XXXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password-Fuerte
REACT_APP_API_URL=https://cuentame-app.azurewebsites.net
PORT=3000
GEMINI_API_KEY=tu_gemini_key
```

2. Comprueba los logs:
```bash
az webapp log tail -g cuentame-rg -n cuentame-app
```

3. Verifica que la BD está accesible:
```bash
# En Azure Portal → Database → Query editor
SELECT 1  # Debe retornar 1
```

---

**Status:** ✅ Lista para usar
**Última actualización:** 19 de Enero de 2026

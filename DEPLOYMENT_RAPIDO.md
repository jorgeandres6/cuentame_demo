# 🚀 DEPLOYMENT A AZURE - OPCIÓN MÁS RÁPIDA

## Tienes 3 Opciones (Elige la más fácil para ti)

---

## ⚡ OPCIÓN 1: Script PowerShell (Más Fácil - Recomendado)

### Paso 1: Abre PowerShell

```powershell
# Click derecho en escritorio → PowerShell como Administrador
```

### Paso 2: Copia y Ejecuta Este Script

```powershell
$projectPath = "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo"
$parentPath = "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME"

# Limpiar y compilar
cd $projectPath
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build

# Crear ZIP
cd $parentPath
Compress-Archive -Path ".\cuentame_demo\*" -DestinationPath cuentame_deploy.zip -Force

Write-Host "✓ ZIP listo en: $parentPath\cuentame_deploy.zip" -ForegroundColor Green
```

### Paso 3: Sube el ZIP a Azure

Ve a: **Azure Portal → App Service → Deployment Center → Upload ZIP**

---

## 🔧 OPCIÓN 2: Con Azure CLI (Automatizado)

### Paso 1: Ejecuta el Script anterior

```powershell
# El script crea el ZIP automáticamente
```

### Paso 2: Deploy con Un Comando

```powershell
az webapp deployment source config-zip `
  --resource-group cuentame-rg `
  --name cuentame-app `
  --src "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_deploy.zip"
```

### Paso 3: Espera y Verifica

```powershell
# Ver logs en tiempo real
az webapp log tail -g cuentame-rg -n cuentame-app --follow

# Probar que está online
Invoke-WebRequest https://cuentame-app.azurewebsites.net/api/health
```

---

## 📦 OPCIÓN 3: Git Push (Más Elegante)

### Paso 1: Setup Git Remote (Una sola vez)

```bash
cd C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo

git remote add azure https://cuentame-app.scm.azurewebsites.net:443/cuentame-app.git
```

### Paso 2: Cada vez que quieras deployar

```bash
git add .
git commit -m "Deploy a Azure"
git push azure main
```

---

## ✅ Verificación Post-Deployment

```bash
# 1. Espera 2-3 minutos después de subir el ZIP

# 2. Abre en navegador
https://cuentame-app.azurewebsites.net/api/health

# Deberías ver:
# {"status":"ok"}

# 3. Si no funciona, revisa logs
az webapp log tail -g cuentame-rg -n cuentame-app
```

---

## 🆘 Si el Error Persiste

### Causa 1: package.json No Está en el ZIP

```powershell
# Verifica así:
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("cuentame_deploy.zip")
$zip.Entries | Where-Object {$_.Name -eq "package.json"}
# Debe retornar algo, si no, recrea el ZIP
```

### Causa 2: Falta .env.production

```powershell
# Crea este archivo en cuentame_demo/
$env = @"
AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password
REACT_APP_API_URL=https://cuentame-app.azurewebsites.net
PORT=3000
GEMINI_API_KEY=tu_gemini_key
"@

$env | Out-File -FilePath "C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo\.env.production"
```

Luego recrea el ZIP.

### Causa 3: Node.js Version Mismatch

Azure por defecto usa Node.js 24. Asegúrate que usas la misma en local:

```bash
node --version
# Debe ser v24.x.x
```

Si no, actualiza o crea `.nvmrc`:

```bash
echo "24" > C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo\.nvmrc
```

---

## 🎯 Mi Recomendación

**Para ti ahora:**

1. Usa **OPCIÓN 1** (Script PowerShell) - Es la más simple
2. Sube el ZIP manualmente a Azure Portal
3. Espera 2-3 minutos
4. Prueba https://cuentame-app.azurewebsites.net

**Para futuros deploys:**

Usa **OPCIÓN 3** (Git Push) - Es automático

---

## 📋 Checklist Final

- [ ] `npm install` ejecutado
- [ ] `npm run build` sin errores
- [ ] `dist/` folder existe
- [ ] `.env.production` tiene credenciales correctas
- [ ] ZIP contiene `package.json` en raíz
- [ ] ZIP no contiene `node_modules/`
- [ ] ZIP menos de 100MB
- [ ] App Service existe en Azure

---

**Si nada de esto funciona, comparte:**
- El error exacto de Azure
- Output de `az webapp log tail`
- Qué opción intentaste

Con eso puedo diagnosticar el problema específico.

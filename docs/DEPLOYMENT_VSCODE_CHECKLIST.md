# ✅ CHECKLIST RÁPIDO: Deploy con VSCode Extension

## 🚀 Antes de Hacer Deploy

Ejecuta esto en la terminal de VSCode (desde `cuentame_demo/`):

```powershell
# 1. Limpiar y compilar
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build

# 2. Verificar archivos críticos
Write-Host ""
Write-Host "=== VALIDACIÓN ===" -ForegroundColor Cyan
Write-Host ""

if (Test-Path package.json) {
    Write-Host "✓ package.json" -ForegroundColor Green
} else {
    Write-Host "✗ FALTA: package.json" -ForegroundColor Red
}

if (Test-Path server.js) {
    Write-Host "✓ server.js" -ForegroundColor Green
} else {
    Write-Host "✗ FALTA: server.js" -ForegroundColor Red
}

if (Test-Path dist) {
    $files = @(Get-ChildItem dist -Recurse).Count
    Write-Host "✓ dist/ ($files archivos)" -ForegroundColor Green
} else {
    Write-Host "✗ FALTA: dist/" -ForegroundColor Red
}

if (Test-Path .env.production) {
    Write-Host "✓ .env.production" -ForegroundColor Green
} else {
    Write-Host "✗ FALTA: .env.production" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== LISTO PARA DEPLOY ===" -ForegroundColor Green
```

---

## 🎯 Pasos de Deployment (VSCode)

### 1️⃣ Abre la Pestaña Azure
- Click en el icono de Azure (izquierda)
- O Ctrl+Shift+A

### 2️⃣ Encuentra tu App Service
```
Azure
└── Suscripción
    └── App Services
        └── cuentame-app
```

### 3️⃣ Deploy
**Opción A (Recomendada):**
- Clic derecho en `cuentame-app`
- Click en **Deploy to Web App**
- Selecciona carpeta: **cuentame_demo**

**Opción B:**
- Ctrl+Shift+P
- Escribe: `Deploy to Web App`
- Sigue instrucciones

### 4️⃣ Espera el Build
VSCode mostrará:
```
npm install...
npm run build...
Deployment successful!
```

### 5️⃣ Verifica
```bash
# En terminal
curl https://cuentame-app.azurewebsites.net/api/health

# O en navegador
https://cuentame-app.azurewebsites.net/api/health
```

---

## 🆘 Si Falla

### Síntoma 1: "package.json not found"

**Solución:**
1. Verifica que estás en la carpeta correcta:
   - File → Open Folder
   - Selecciona: `C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo`

2. Verifica que `package.json` existe:
   ```powershell
   ls package.json
   # Debe listar el archivo
   ```

3. Reintenta deploy

### Síntoma 2: "Build failed"

**Solución:**
1. Ejecuta localmente:
   ```bash
   npm install
   npm run build
   ```

2. Verifica que no hay errores

3. Reintenta deploy

### Síntoma 3: "Extension no detecta App Service"

**Solución:**
1. En pestaña Azure, haz clic en "Sign in to Azure..."
2. Espera a que cargue
3. Debería aparecer tu App Service

---

## 📊 Lo Que Debería Pasar

```
Paso 1: Haces clic en "Deploy to Web App"
   ↓
Paso 2: VSCode sube los archivos
   ↓
Paso 3: Azure ejecuta "npm install"
   ↓
Paso 4: Azure ejecuta "npm run build" (si no existe dist/)
   ↓
Paso 5: Azure inicia servidor Node.js
   ↓
Paso 6: App Service está online
   ↓
Paso 7: Puedes acceder a https://cuentame-app.azurewebsites.net
```

---

## 🔗 Archivos Relacionados

- [DEPLOYMENT_VSCODE_EXTENSION.md](DEPLOYMENT_VSCODE_EXTENSION.md) - Guía completa
- [DEPLOYMENT_RAPIDO.md](DEPLOYMENT_RAPIDO.md) - Si quieres otro método
- [DEPLOYMENT_ORYX_FIX.md](DEPLOYMENT_ORYX_FIX.md) - Si necesitas troubleshoot

---

**Tip:** Si aún así falla, ve a [DEPLOYMENT_VSCODE_EXTENSION.md](DEPLOYMENT_VSCODE_EXTENSION.md) sección "Si Aún Falla"

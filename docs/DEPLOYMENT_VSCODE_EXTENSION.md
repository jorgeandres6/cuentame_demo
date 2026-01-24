# 🚀 DEPLOYMENT CON VSCODE AZURE EXTENSION

## ⚠️ El Problema con la Extensión de VSCode

Cuando usas la extensión de Azure App Service de VSCode, a veces no incluye `package.json` correctamente en el zip.

**Error que ves:**
```
Error: Couldn't detect a version for the platform 'nodejs' in the repo.
```

**Causa:** La extensión está zipeando el contenido sin la estructura correcta.

---

## ✅ Solución Paso a Paso con VSCode Extension

### Paso 1: Preparar el Proyecto Localmente

```bash
# En terminal de VSCode
cd C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo

# Limpiar
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Instalar dependencias
npm install

# Compilar
npm run build

# Verificar que dist/ existe
dir dist
# Debe mostrar archivos compilados
```

### Paso 2: Verificar .env.production

Asegúrate que existe en la raíz de `cuentame_demo/`:

```
.env.production
├── AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
├── AZURE_SQL_DATABASE=cuentame_db
├── AZURE_SQL_USER=cuentame_admin
├── AZURE_SQL_PASSWORD=Tu-Password-Fuerte
├── REACT_APP_API_URL=https://cuentame-app.azurewebsites.net
├── PORT=3000
└── GEMINI_API_KEY=tu_gemini_key
```

### Paso 3: En VSCode - Deploy

**Opción A: Desde Explorer (La más fácil)**

1. En VSCode, abre la pestaña **Azure** (icono de Azure a la izquierda)

2. Busca tu suscripción → App Services → **cuentame-app**

3. Haz clic derecho en **cuentame-app** → **Deploy to Web App**

4. Selecciona carpeta: **cuentame_demo/**

5. Si pregunta si quieres actualizar los settings de deployment:
   - Click en **Deploy**

6. Espera a que compile (verás progress en la terminal)

**Opción B: Usando Command Palette**

1. Presiona `Ctrl + Shift + P`

2. Escribe: `Azure App Service: Deploy to Web App`

3. Selecciona tu suscripción y app

4. Selecciona la carpeta: `cuentame_demo`

### Paso 4: Monitorear el Deployment

VSCode mostrará el progreso en la **Output** terminal:

```
Deploying to cuentame-app...
Running build commands...
npm install
npm run build
...
Deployment successful!
```

### Paso 5: Verificar que Funciona

```bash
# En terminal de VSCode
curl https://cuentame-app.azurewebsites.net/api/health

# Debe retornar:
# {"status":"ok"}
```

---

## 🔧 Si Aún Falla con la Extensión

### Problema 1: "package.json not found"

**Solución:** Asegúrate que la extensión detecta la carpeta correcta

1. En VSCode, abre la carpeta correcta:
   - File → Open Folder
   - Selecciona: `C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo`

2. Verifica que en el explorador ves:
   ```
   cuentame_demo/
   ├── package.json          ← DEBE estar aquí
   ├── server.js
   ├── src/
   ├── dist/                 ← DEBE estar aquí (compilado)
   └── ...
   ```

3. Reintenta el deploy desde VSCode

### Problema 2: "Build failed"

**Solución:** La extensión quizá intenta compilar de nuevo

En `.vscode/settings.json` (o crear si no existe):

```json
{
  "appService.preDeployTask": "build",
  "appService.deploySubpath": "."
}
```

O mejor aún, en `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Deploy to Azure",
      "type": "node",
      "request": "launch",
      "preLaunchTask": "npm: build"
    }
  ]
}
```

### Problema 3: Extensión No Detecta App Service

**Solución:**

1. Abre la pestaña Azure en VSCode
2. Haz clic en "Sign in to Azure..." (si no estás signed)
3. Completa el login
4. Espera a que cargue la lista de recursos
5. Debería aparecer tu App Service

---

## 💡 Mejores Prácticas para VSCode Extension

### ✅ Antes de Cada Deploy

```bash
# Terminal en VSCode
npm run build

# Verifica que dist/ tiene contenido
if (Test-Path dist) { dir dist } else { Write-Host "ERROR: No dist/" }

# Verifica package.json
if (Test-Path package.json) { Write-Host "✓ package.json existe" }

# Verifica .env.production
if (Test-Path .env.production) { Write-Host "✓ .env.production existe" }
```

### ✅ Configuración Recomendada en VSCode

En `.vscode/settings.json`:

```json
{
  "appService.deploySubpath": ".",
  "appService.defaultNode": "14.0.0",
  "appService.enableSlotLocalGit": true,
  "[javascript]": {
    "editor.formatOnSave": true
  }
}
```

### ✅ Workflow Óptimo

```
1. Develop localmente
   ↓
2. npm run build
   ↓
3. Prueba en local: npm run dev
   ↓
4. VSCode: Azure Extension → Deploy to Web App
   ↓
5. Espera 2-3 minutos
   ↓
6. Verifica: https://cuentame-app.azurewebsites.net/api/health
```

---

## 🆘 Debug: Ver los Logs del Deployment

Si el deployment falla, puedes ver los logs de Oryx:

### Opción 1: Desde VSCode

1. Pestaña Azure
2. Haz clic derecho en cuentame-app
3. View Stream Logs
4. Verás los logs en tiempo real

### Opción 2: Desde Azure Portal

1. Azure Portal → App Service → cuentame-app
2. Log Stream (en el menú lateral)
3. Verás los logs en tiempo real

### Opción 3: SSH a la App

1. Azure Portal → cuentame-app → SSH
2. Ejecuta:
   ```bash
   ls -la
   # Debe mostrar package.json y dist/
   
   cat package.json
   # Verifica que está correcto
   ```

---

## 📋 Checklist Pre-Deploy (VSCode)

- [ ] Estás en la carpeta: `cuentame_demo/`
- [ ] `npm install` ejecutado
- [ ] `npm run build` sin errores
- [ ] `dist/` existe y tiene contenido
- [ ] `.env.production` existe con valores correctos
- [ ] `package.json` existe en la raíz
- [ ] Extension de Azure instalada y conectada
- [ ] Ves tu App Service en la pestaña Azure

---

## ⚡ Quick Command para Compilar

En VSCode, abre terminal y ejecuta:

```powershell
# Una sola línea que hace todo
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue; npm install; npm run build; Write-Host "✓ Listo para deploy"
```

Luego haz click derecho en App Service → Deploy

---

## 🔄 Si Quieres Revertir a una Versión Anterior

En Azure Portal → cuentame-app → Deployment Center → Deployment history

Selecciona un deployment anterior y haz clic en **Redeploy**

---

## 📞 Solución Rápida si Todo Falla

Si nada funciona con la extensión:

```powershell
# Vuelve a PowerShell (que es más confiable)
# Ve a: DEPLOYMENT_RAPIDO.md

# O usa Git (aún más confiable)
cd C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo
git add .
git commit -m "Deploy"
git push azure main
```

---

**Status:** ✅ Listo para usar con VSCode Extension
**Última actualización:** 19 de Enero de 2026
